"use client";

import { useState, useTransition, type ComponentProps, createElement } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle, Calendar, Clock, icons } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import type { Doctor, AppointmentSlot, IconName } from "@/lib/types";
import { handleAppointmentRequest } from "./actions";
import type { ConfirmAppointmentOutput } from "@/ai/flows/smart-appointment-confirmation";


const formSchema = z.object({
  patientName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  contactNumber: z.string().min(10, { message: "Please enter a valid contact number." }),
  requirements: z.string().optional(),
});

type DoctorCardProps = {
  doctor: Doctor;
} & ComponentProps<typeof Card>;

function DoctorCard({ doctor, className, ...props }: DoctorCardProps) {
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

type AppointmentCardProps = {
  slot: AppointmentSlot;
  doctor?: Doctor;
  onBook: () => void;
} & ComponentProps<typeof Card>;

function AppointmentCard({ slot, doctor, onBook, className, ...props }: AppointmentCardProps) {
  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg hover:border-primary/50", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> {format(slot.date, "EEEE, MMMM d")}</CardTitle>
        <CardDescription className="flex items-center gap-2"><Clock className="h-5 w-5 text-muted-foreground" /> {format(slot.date, "p")}</CardDescription>
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
        <Button onClick={onBook} className="w-full bg-accent hover:bg-accent/90">Book Now</Button>
      </CardFooter>
    </Card>
  );
}

export function AppointmentBooking({
  doctors,
  appointmentSlots,
}: {
  doctors: Doctor[];
  appointmentSlots: AppointmentSlot[];
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
      form.reset();
    });
  };

  const doctorMap = new Map(doctors.map(doc => [doc.id, doc]));

  return (
    <div className="space-y-16">
      <section id="doctors" className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Our Specialists</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Meet our team of dedicated and experienced medical professionals.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {doctors.map(doctor => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      </section>

      <section id="appointments" className="text-center">
        <h2 className="text-3xl font-bold font-headline mb-2">Available Appointments</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8">Choose a time slot that works for you. Our AI assistant will confirm your booking.</p>
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
            <DialogTitle>Request Appointment</DialogTitle>
            <DialogDescription>
              Please fill out your details to request an appointment for {selectedSlot && format(selectedSlot.date, "MMMM d, yyyy 'at' p")}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(123) 456-7890" {...field} />
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
                    <FormLabel>Specific Requirements (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., wheelchair access, specific concerns" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Request Appointment
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
                Appointment {confirmationResult.confirmationStatus ? 'Confirmed!' : 'Request Status'}
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-4 space-y-2">
                <p>{confirmationResult.reason}</p>
                {confirmationResult.confirmationStatus && selectedSlot && (
                  <div className="p-4 bg-muted/50 rounded-lg text-foreground">
                    <p><strong>Doctor:</strong> {doctorMap.get(selectedSlot.doctorId)?.name}</p>
                    <p><strong>Date:</strong> {format(selectedSlot.date, "EEEE, MMMM d, yyyy")}</p>
                    <p><strong>Time:</strong> {format(selectedSlot.date, "p")}</p>
                    <p className="text-sm mt-2 text-muted-foreground">You will receive an email/SMS with your appointment details shortly.</p>
                  </div>
                )}
                {!confirmationResult.confirmationStatus && confirmationResult.suggestedAlternative && (
                  <p>
                    <strong>Suggested Alternative:</strong> {confirmationResult.suggestedAlternative}
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setConfirmationOpen(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
