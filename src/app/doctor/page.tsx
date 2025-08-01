"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Stethoscope, LogOut, User, Calendar, Clock, Check, X, AlertCircle, PartyPopper, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { handleCancelAppointment } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">
            MediSchedule - Portal del Doctor
          </h1>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/login">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Link>
        </Button>
      </div>
    </header>
  );
}

export default function DoctorPage() {
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [approvedAppointments, setApprovedAppointments] = useState<Appointment[]>([]);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [conflictAppointment, setConflictAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  
  // This is a temporary doctor ID for demonstration.
  // In a real app, this would come from the authenticated doctor's profile.
  const FAKE_DOCTOR_ID = "1";

  useEffect(() => {
    const q = query(
      collection(db, "appointments"),
      where("doctor.id", "==", FAKE_DOCTOR_ID)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pending: Appointment[] = [];
      const approved: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const appointment = { 
            id: doc.id, 
            ...data, 
            appointmentDate: (data.appointmentDate as Timestamp).toDate() 
        } as Appointment;

        if (appointment.status === 'pending') {
          pending.push(appointment);
        } else if (appointment.status === 'approved') {
          approved.push(appointment);
        }
      });
      setPendingAppointments(pending.sort((a,b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
      setApprovedAppointments(approved.sort((a,b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
     if(!id) return;
    const appointmentRef = doc(db, 'appointments', id);
    await updateDoc(appointmentRef, { status: 'approved' });
  };

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
  };
  
  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setIsCancelling(true);
    const { success, message } = await handleCancelAppointment(appointmentToCancel.id!, appointmentToCancel.doctor.id, appointmentToCancel.appointmentDate);
    
    toast({
        title: success ? "Éxito" : "Error",
        description: message,
        variant: success ? "default" : "destructive",
    });

    setAppointmentToCancel(null);
    setIsCancelling(false);
  };
  
  const handleConflictClick = (appointment: Appointment) => {
     setConflictAppointment(appointment);
  };

  const hasConflict = (pendingAppointment: Appointment): boolean => {
    return approvedAppointments.some(
      approved => approved.appointmentDate.getTime() === pendingAppointment.appointmentDate.getTime()
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Citas Pendientes</CardTitle>
            <CardDescription>Revise, confirme o rechace las nuevas solicitudes de citas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">Cargando...</TableCell>
                    </TableRow>
                ) : pendingAppointments.length > 0 ? (
                  pendingAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className={hasConflict(appointment) ? 'bg-yellow-500/10' : ''}>
                      <TableCell className="font-medium">{appointment.patientName}</TableCell>
                      <TableCell>{format(appointment.appointmentDate, "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                      <TableCell>{format(appointment.appointmentDate, "p", { locale: es })}</TableCell>
                      <TableCell>{appointment.requirements || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {hasConflict(appointment) ? (
                            <Button variant="outline" size="icon" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white" onClick={() => handleConflictClick(appointment)}>
                                <AlertCircle className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button variant="outline" size="icon" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => handleApprove(appointment.id!)}>
                                <Check className="h-4 w-4" />
                            </Button>
                        )}
                         <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleCancelClick(appointment)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No hay citas pendientes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Citas Aprobadas</CardTitle>
            <CardDescription>Estas son las citas que ha confirmado. Los pacientes han sido notificados.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="flex justify-center">
                      <CalendarComponent
                          mode="multiple"
                          selected={approvedAppointments.map(a => a.appointmentDate)}
                          className="rounded-md border"
                          locale={es}
                      />
                  </div>
            {isLoading ? (
                 <div className="text-center py-12 text-muted-foreground">Cargando...</div>
            ) : approvedAppointments.length > 0 ? (
                 <div className="space-y-4">
                    {approvedAppointments.map(appointment => (
                        <Card key={appointment.id} className="bg-green-500/10 border-green-500/20">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-bold flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                     <PartyPopper className="h-5 w-5 text-green-600"/> {appointment.patientName}
                                  </div>
                                   <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-100 hover:text-red-600" onClick={() => handleCancelClick(appointment)}>
                                      <X className="h-4 w-4" />
                                   </Button>
                                </CardTitle>
                                <CardDescription className="text-green-900/80 pt-1">{appointment.requirements || 'Sin requisitos adicionales.'}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4 text-sm">
                                <Badge variant="secondary" className="bg-green-100"><Calendar className="h-4 w-4 mr-1"/> {format(appointment.appointmentDate, "d MMM yyyy", { locale: es })}</Badge>
                                <Badge variant="secondary" className="bg-green-100"><Clock className="h-4 w-4 mr-1"/> {format(appointment.appointmentDate, "p", { locale: es })}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground col-span-2">
                    <p>Aún no hay citas aprobadas.</p>
                </div>
            )}
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="bg-card mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados.
        </div>
      </footer>

      {appointmentToCancel && (
        <AlertDialog open={!!appointmentToCancel} onOpenChange={() => setAppointmentToCancel(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <X className="h-6 w-6 text-destructive" />
                        Confirmar Cancelación
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-4">
                        ¿Está seguro de que desea cancelar la cita para <strong>{appointmentToCancel.patientName}</strong>? Esta acción no se puede deshacer y el horario se volverá a abrir para otros pacientes.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>No, mantener cita</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmCancel} disabled={isCancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                       {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       Sí, cancelar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

      {conflictAppointment && (
        <AlertDialog open={!!conflictAppointment} onOpenChange={() => setConflictAppointment(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-yellow-500" />
                        ¡Conflicto de Agendamiento!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-4">
                        La solicitud para <strong>{conflictAppointment.patientName}</strong> a las <strong>{format(conflictAppointment.appointmentDate, "p", { locale: es })}</strong> del <strong>{format(conflictAppointment.appointmentDate, "d 'de' MMMM", { locale: es })}</strong> tiene un conflicto con una cita ya aprobada.
                        <br /><br />
                        Por favor, <strong>cancele esta solicitud</strong> y pida al paciente que elija otro horario, o póngase en contacto para reagendarla manualmente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setConflictAppointment(null)}>Entendido</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
