
"use client";

import { useState, useTransition, type ComponentProps, createElement, useEffect } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, CheckCircle2, XCircle, Calendar as CalendarIcon, Clock, icons, Info, Trash2 } from "lucide-react";

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
  AlertDialogCancel,
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
import type { Doctor, AppointmentSlot, IconName, BookedAppointment, ConfirmAppointmentOutput, Appointment } from "@/lib/types";
import { handleAppointmentRequest, handleCancelAppointment } from "./actions";
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
  const date = slot.date instanceof Date ? slot.date : new Date(slot.date);
  
  if (isNaN(date.getTime())) {
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
  const [appointmentToCancel, setAppointmentToCancel] = useState<BookedAppointment | null>(null);

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

  const handleCancelClick = (appointment: BookedAppointment) => {
    setAppointmentToCancel(appointment);
  };
  
  const handleConfirmCancel = () => {
    if (!appointmentToCancel) return;

    startTransition(async () => {
        const { success, message } = await handleCancelAppointment(appointmentToCancel.id, appointmentToCancel.doctorId, appointmentToCancel.date);
        
        toast({
            title: success ? "Éxito" : "Error",
            description: message,
            variant: success ? "default" : "destructive",
        });

        setAppointmentToCancel(null);
    });
  };

  const doctorMap = new Map(doctors.map(doc => [doc.id, doc]));
  const allBookedDates = bookedAppointments.map(a => a.date);

  const pendingAppointments = bookedAppointments.filter(a => a.status === 'pending');
  const approvedAppointments = bookedAppointments.filter(a => a.status === 'approved');

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

       {(approvedAppointments.length > 0 || pendingAppointments.length > 0) && (
          <section id="my-appointments">
              <div className="text-center">
                 <h2 className="text-3xl font-bold font-headline mb-2">Mis Citas</h2>
                 <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Aquí puede ver sus próximas citas y su estado.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="flex justify-center">
                      <Calendar
                          mode="multiple"
                          selected={allBookedDates}
                          className="rounded-md border"
                          locale={es}
                      />
                  </div>
                  <div className="space-y-6">
                      
                      {approvedAppointments.length > 0 && (
                          <div>
                              <h3 className="text-xl font-semibold mb-4 text-green-600">Aprobadas</h3>
                              <div className="space-y-4">
                                {approvedAppointments.sort((a, b) => a.date.getTime() - b.date.getTime()).map(appointment => (
                                      <Card key={appointment.id} className="text-left bg-green-500/10 border-green-500/20">
                                          <CardHeader>
                                              <CardTitle className="text-lg flex justify-between items-center">
                                                  Cita con {appointment.doctor.name}
                                                  <Badge variant="default" className="bg-green-600">Aprobada</Badge>
                                              </CardTitle>
                                              <CardDescription className="text-green-900/80">
                                                  {appointment.doctor.specialty}
                                              </CardDescription>
                                          </CardHeader>
                                          <CardContent className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-5 w-5 text-green-700" />
                                                <span>{format(appointment.date, "EEEE, d 'de' MMMM", { locale: es })}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                                <span>{format(appointment.date, "p", { locale: es })}</span>
                                              </div>
                                          </CardContent>
                                          <CardFooter>
                                             <Button variant="destructive" size="sm" onClick={() => handleCancelClick(appointment)} disabled={isPending}>
                                                <Trash2 className="mr-2 h-4 w-4"/>
                                                {isPending ? 'Cancelando...' : 'Cancelar Cita'}
                                             </Button>
                                          </CardFooter>
                                      </Card>
                                  ))}
                              </div>
                          </div>
                      )}

                      {pendingAppointments.length > 0 && (
                           <div>
                              <h3 className="text-xl font-semibold mb-4 text-yellow-600">Pendientes de Aprobación</h3>
                              <div className="space-y-4">
                                  {pendingAppointments.sort((a, b) => a.date.getTime() - b.date.getTime()).map(appointment => (
                                      <Card key={appointment.id} className="text-left bg-yellow-500/10 border-yellow-500/20">
                                           <CardHeader>
                                              <CardTitle className="text-lg flex justify-between items-center">
                                                  Solicitud para {appointment.doctor.name}
                                                  <Badge variant="secondary" className="bg-yellow-500 text-white">Pendiente</Badge>
                                              </CardTitle>
                                               <CardDescription className="text-yellow-900/80">
                                                  {appointment.doctor.specialty}
                                              </CardDescription>
                                          </CardHeader>
                                          <CardContent className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-5 w-5 text-yellow-700" />
                                                <span>{format(appointment.date, "EEEE, d 'de' MMMM", { locale: es })}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-muted-foreground" />
                                                <span>{format(appointment.date, "p", { locale: es })}</span>
                                              </div>
                                          </CardContent>
                                           <CardFooter>
                                             <Button variant="destructive" size="sm" onClick={() => handleCancelClick(appointment)} disabled={isPending}>
                                                <Trash2 className="mr-2 h-4 w-4"/>
                                                {isPending ? 'Cancelando...' : 'Cancelar Solicitud'}
                                             </Button>
                                          </CardFooter>
                                      </Card>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </section>
      )}

      <section id="appointments" className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Citas Disponibles</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Elija un horario que le convenga. Su solicitud será enviada para aprobación del doctor.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {appointmentSlots.map(slot => (
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
            <DialogTitle>Solicitar Cita</DialogTitle>
            <DialogDescription>
              Por favor, complete sus datos para solicitar su cita para el {selectedSlot && format(selectedSlot.date, "d 'de' MMMM, yyyy 'a las' p", { locale: es })}.
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
                  Enviar Solicitud
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
                  {confirmationResult.confirmationStatus ? "Solicitud Enviada" : "Error"}
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

      {appointmentToCancel && (
        <AlertDialog open={!!appointmentToCancel} onOpenChange={() => setAppointmentToCancel(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-6 w-6 text-destructive" />
                        Confirmar Cancelación
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-4">
                        ¿Está seguro de que desea cancelar su cita con <strong>{appointmentToCancel.doctor.name}</strong> para el <strong>{format(appointmentToCancel.date, "d 'de' MMMM 'a las' p", { locale: es })}</strong>? Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmCancel} className={cn(buttonVariants({ variant: "destructive" }))}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sí, cancelar cita
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}