"use client";

import { useState, useTransition, type ComponentProps, createElement } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, CheckCircle2, XCircle, Calendar as CalendarIcon, Clock, icons } from "lucide-react";

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


const formSchema = z.object({
  patientName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  contactNumber: z.string().min(9, { message: "Por favor, ingrese un número de contacto válido." }),
  requirements: z.string().optional(),
});

function DoctorCard({ doctor, className, ...props }: { doctor: Doctor } & ComponentProps<typeof Card>) {
  const IconComponent = icons[doctor.icon];

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
        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground/80">
          {IconComponent && createElement(IconComponent, { className: "mr-2 h-4 w-4 text-accent" })}
          {doctor.specialty}
        </Badge>
      </CardContent>
    </Card>
  );
}

function AppointmentCard({ slot, doctor, onBook, className, ...props }: { slot: AppointmentSlot; doctor?: Doctor; onBook: () => void; } & ComponentProps<typeof Card>) {
  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg hover:border-primary/50", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2 capitalize"><CalendarIcon className="h-5 w-5 text-primary" /> {format(slot.date, "EEEE, d 'de' MMMM", { locale: es })}</CardTitle>
        <CardDescription className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" /> {format(slot.date, "p", { locale: es })}</CardDescription>
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
}: {
  doctors: Doctor[];
  appointmentSlots: AppointmentSlot[];
  onAppointmentBooked: (appointment: BookedAppointment) => void;
  bookedAppointments: BookedAppointment[];
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
        appointmentDate: format(selectedSlot.date, 'yyyy-MM-dd'),
        appointmentTime: format(selectedSlot.date, 'HH:mm'),
        doctorName: doctor.name,
      });

      setConfirmationResult(result);
      setFormOpen(false);
      setConfirmationOpen(true);

      if (result.confirmationStatus) {
        onAppointmentBooked({ ...selectedSlot, doctor });
      }

      form.reset();
    });
  };

  const doctorMap = new Map(doctors.map(doc => [doc.id, doc]));
  const bookedDates = bookedAppointments.map(a => a.date);

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
              <h2 className="text-3xl font-bold font-headline mb-2">Mis Citas Pendientes</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Aquí puede ver sus próximas citas. Recibirá una notificación cuando el doctor las confirme.</p>
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
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Elija un horario que le convenga. Nuestro asistente de IA confirmará su reserva.</p>
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
              Por favor, complete sus datos para solicitar una cita para el {selectedSlot && format(selectedSlot.date, "d 'de' MMMM, yyyy 'a las' p", { locale: es })}.
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
                  Solicitar Cita
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
                {confirmationResult.confirmationStatus ? '¡Cita Confirmada!' : 'Estado de la Solicitud'}
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-4 space-y-2">
                <span>{confirmationResult.reason}</span>
                {confirmationResult.confirmationStatus && selectedSlot && (
                  <div className="p-4 bg-muted/50 rounded-lg text-foreground">
                    <div><strong>Doctor:</strong> {doctorMap.get(selectedSlot.doctorId)?.name}</div>
                    <div><strong>Fecha:</strong> {format(selectedSlot.date, "EEEE, d 'de' MMMM, yyyy", { locale: es })}</div>
                    <div><strong>Hora:</strong> {format(selectedSlot.date, "p", { locale: es })}</div>
                    <p className="text-sm mt-2 text-muted-foreground">Recibirá un correo electrónico/SMS con los detalles de su cita en breve.</p>
                  </div>
                )}
                {!confirmationResult.confirmationStatus && confirmationResult.suggestedAlternative && (
                  <p>
                    <strong>Alternativa Sugerida:</strong> {confirmationResult.suggestedAlternative}
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setConfirmationOpen(false)}>Cerrar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
