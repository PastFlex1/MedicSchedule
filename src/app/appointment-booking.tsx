
"use client";

import { useState, useTransition, type ComponentProps, createElement, useEffect } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, CheckCircle2, XCircle, Calendar as CalendarIcon, Clock, icons, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Doctor, AppointmentSlot, IconName, BookedAppointment, ConfirmAppointmentOutput } from "@/lib/types";
import { handleAppointmentRequest } from "./actions";
import { collection, getDocs, doc, setDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from "@/lib/firebase";


const formSchema = z.object({
  patientName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  contactNumber: z.string().min(9, { message: "Por favor, ingrese un número de contacto válido." }),
  requirements: z.string().optional(),
});


function DoctorCard({ doctor, className, ...props }: { doctor: Doctor } & ComponentProps<typeof Card>) {
  const IconComponent = doctor.icon ? icons[doctor.icon] : null;

  return (
    <Card className={cn("flex flex-col text-center items-center p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1", className)} {...props}>
      <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
        <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint={doctor.dataAiHint} />
        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <CardHeader className="p-0 mb-2">
        <CardTitle className="font-headline text-xl">{doctor.name}</CardTitle>
        <CardDescription className="text-primary">{doctor.specialty}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {IconComponent && (
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground/80">
                {createElement(IconComponent, { className: "mr-2 h-4 w-4 text-accent" })}
                {doctor.specialty}
            </Badge>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentCard({ slot, doctor, onBook, className, ...props }: { slot: AppointmentSlot; doctor?: Doctor; onBook: () => void; } & ComponentProps<typeof Card>) {
  // Ensure date is a valid Date object before formatting
  const date = slot.date instanceof Date ? slot.date : new Date(slot.date);
  
  if (isNaN(date.getTime())) {
    // Handle invalid date gracefully
    return (
       <Card className={cn("transition-all duration-300 hover:shadow-lg hover:border-primary/50", className)} {...props}>
          <CardHeader>
             <CardTitle>Horario no válido</CardTitle>
          </CardHeader>
       </Card>
    )
  }

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg hover:border-primary/50", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2 capitalize"><CalendarIcon className="h-5 w-5 text-primary" /> {format(date, "EEEE, d 'de' MMMM", { locale: es })}</CardTitle>
        <CardDescription className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" /> {format(date, "p", { locale: es })}</CardDescription>
      </CardHeader>
      {doctor && (
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={doctor.avatarUrl} alt={doctor.name} data-ai-hint={doctor.dataAiHint} />
              <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{doctor.name}</p>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            </div>
          </div>
        </CardContent>
      )}
      <CardFooter>
        <Button onClick={onBook} className="w-full bg-accent hover:bg-accent/90">Reservar Ahora</Button>
      </CardFooter>
    </Card>
  );
}

export function AppointmentBooking({
  doctors,
  appointmentSlots,
  onAppointmentBooked,
  bookedAppointments = [],
  patientId,
}: {
  doctors: Doctor[];
  appointmentSlots: AppointmentSlot[];
  onAppointmentBooked: (slotId: string) => void;
  bookedAppointments: BookedAppointment[];
  patientId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmAppointmentOutput | null>(null);
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      contactNumber: "",
      requirements: "",
    },
  });

  const handleBookClick = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
    setFormOpen(true);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!selectedSlot) return;

    const doctor = doctors.find(d => d.id === selectedSlot.doctorId);
    if (!doctor) return;

    startTransition(async () => {
      const result = await handleAppointmentRequest(values, {
        appointmentDate: selectedSlot.date,
        doctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty
        },
        patientId,
      });

      setConfirmationResult(result);
      setFormOpen(false);
      setConfirmationOpen(true);

      if (result.confirmationStatus) {
        // Remove the booked slot from the available slots in Firestore
        const slotDocRef = doc(db, 'appointmentSlots', selectedSlot.id);
        await deleteDoc(slotDocRef);
        onAppointmentBooked(selectedSlot.id);
      }

      form.reset();
    });
  };

  const doctorMap = new Map(doctors.map(doc => [doc.id, doc]));
  const bookedDates = bookedAppointments.map(a => a.date);
  
  const availableSlots = appointmentSlots.filter(slot => 
    !bookedAppointments.some(booked => {
        // Ensure both dates are valid Date objects before comparing
        const bookedDate = booked.date instanceof Date ? booked.date : new Date(booked.date);
        const slotDate = slot.date instanceof Date ? slot.date : new Date(slot.date);
        if (isNaN(bookedDate.getTime()) || isNaN(slotDate.getTime())) return false;
        return bookedDate.getTime() === slotDate.getTime() && booked.doctorId === slot.doctorId;
    })
  );


  return (
    <div className="space-y-16">
      <section id="doctors" className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Nuestros Especialistas</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Conozca a nuestro equipo de profesionales médicos dedicados y experimentados.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {doctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </section>

      {bookedAppointments.length > 0 && (
          <section id="pending-appointments" className="text-center">
              <h2 className="text-3xl font-bold font-headline mb-2">Mis Citas Confirmadas</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Aquí puede ver sus próximas citas confirmadas.</p>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="flex justify-center">
                      <Calendar
                          mode="multiple"
                          selected={bookedDates}
                          className="rounded-md border"
                          locale={es}
                      />
                  </div>
                  <div className="space-y-4">
                      {bookedAppointments.sort((a, b) => a.date.getTime() - b.date.getTime()).map(appointment => (
                          <Card key={appointment.id} className="text-left">
                              <CardHeader>
                                  <CardTitle className="text-lg">
                                      Cita con {appointment.doctor.name}
                                  </CardTitle>
                                  <CardDescription>
                                      {appointment.doctor.specialty}
                                  </CardDescription>
                              </CardHeader>
                              <CardContent className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                    <span>{format(appointment.date, "EEEE, d 'de' MMMM", { locale: es })}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <span>{format(appointment.date, "p", { locale: es })}</span>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </div>
          </section>
      )}

      <section id="appointments" className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Citas Disponibles</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Elija un horario que le convenga para recibir confirmación inmediata.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {availableSlots.map(slot => (
            <AppointmentCard
              key={slot.id}
              slot={slot}
              doctor={doctorMap.get(slot.doctorId)}
              onBook={() => handleBookClick(slot)}
            />
          ))}
        </div>
      </section>

      <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Cita</DialogTitle>
            <DialogDescription>
              Por favor, complete sus datos para confirmar su cita para el {selectedSlot && format(selectedSlot.date, "d 'de' MMMM, yyyy 'a las' p", { locale: es })}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="912 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requisitos Específicos (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej: acceso para silla de ruedas, inquietudes específicas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Cita
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {confirmationResult && (
        <AlertDialog open={isConfirmationOpen} onOpenChange={setConfirmationOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {confirmationResult.confirmationStatus ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                  {confirmationResult.confirmationStatus ? "Cita Confirmada" : "Error"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmationResult.reason}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4">
                {confirmationResult.confirmationStatus && selectedSlot && (
                   <div className="p-4 -mx-2 -mb-4 bg-muted/50 rounded-lg text-foreground text-sm space-y-1">
                    <div><strong>Doctor:</strong> {doctorMap.get(selectedSlot.doctorId)?.name}</div>
                    <div><strong>Fecha:</strong> {format(selectedSlot.date, "EEEE, d 'de' MMMM, yyyy", { locale: es })}</div>
                    <div><strong>Hora:</strong> {format(selectedSlot.date, "p", { locale: es })}</div>
                  </div>
                )}
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setConfirmationOpen(false)}>Cerrar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
