"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Stethoscope, LogOut, User, Calendar, Clock, Check, X, AlertCircle, PartyPopper } from 'lucide-react';
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import type { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
        const appointment = { id: doc.id, ...doc.data() } as Appointment;
        if (appointment.status === 'pending') {
          pending.push(appointment);
        } else if (appointment.status === 'approved') {
          approved.push(appointment);
        }
      });
      setPendingAppointments(pending.sort((a,b) => a.appointmentDate.toMillis() - b.appointmentDate.toMillis()));
      setApprovedAppointments(approved.sort((a,b) => a.appointmentDate.toMillis() - b.appointmentDate.toMillis()));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
     if(!id) return;
    const appointmentRef = doc(db, 'appointments', id);
    await updateDoc(appointmentRef, { status: 'approved' });
  };

  const handleCancel = async (id: string) => {
     if(!id) return;
    const appointmentRef = doc(db, 'appointments', id);
    // Instead of deleting, we can mark as cancelled
    // await updateDoc(appointmentRef, { status: 'cancelled' });
    // Or, for this demo, we'll just delete it.
    await deleteDoc(appointmentRef);
    
    // Also, we need to make the slot available again.
    const appointmentSnap = await getDoc(appointmentRef);
    if(appointmentSnap.exists()) {
        const appointmentData = appointmentSnap.data();
        const slotId = `${appointmentData.doctor.id}_${appointmentData.appointmentDate.toDate().toISOString()}`;
        const slotRef = doc(db, "appointmentSlots", slotId);
        // This assumes the slot was removed. If not, this logic needs adjustment.
        // For this app, we'll assume we need to re-create it.
        await setDoc(slotRef, {
            doctorId: appointmentData.doctor.id,
            date: appointmentData.appointmentDate.toDate()
        });
    }
  };
  
  const handleRescheduleClick = (appointment: Appointment) => {
     setRescheduleAppointment(appointment);
  };


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
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.patientName}</TableCell>
                      <TableCell>{format(appointment.appointmentDate.toDate(), "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                      <TableCell>{format(appointment.appointmentDate.toDate(), "p", { locale: es })}</TableCell>
                      <TableCell>{appointment.requirements || 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                         <Button variant="outline" size="icon" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white" onClick={() => handleApprove(appointment.id!)}>
                          <Check className="h-4 w-4" />
                        </Button>
                         <Button variant="outline" size="icon" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleCancel(appointment.id!)}>
                          <X className="h-4 w-4" />
                        </Button>
                         <Button variant="outline" size="icon" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white" onClick={() => handleRescheduleClick(appointment)}>
                          <AlertCircle className="h-4 w-4" />
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
            {isLoading ? (
                 <div className="text-center py-12 text-muted-foreground">Cargando...</div>
            ) : approvedAppointments.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {approvedAppointments.map(appointment => (
                        <Card key={appointment.id} className="bg-green-500/10 border-green-500/20">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2"><PartyPopper className="h-5 w-5 text-green-600"/> {appointment.patientName}</CardTitle>
                                <CardDescription className="text-green-900/80">{appointment.requirements || 'N/A'}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex items-center gap-4 text-sm">
                                <Badge variant="secondary" className="bg-green-100"><Calendar className="h-4 w-4 mr-1"/> {format(appointment.appointmentDate.toDate(), "d MMM yyyy", { locale: es })}</Badge>
                                <Badge variant="secondary" className="bg-green-100"><Clock className="h-4 w-4 mr-1"/> {format(appointment.appointmentDate.toDate(), "p", { locale: es })}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Aún no hay citas aprobadas.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="bg-card mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados.
        </div>
      </footer>

      {rescheduleAppointment && (
        <AlertDialog open={!!rescheduleAppointment} onOpenChange={() => setRescheduleAppointment(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-6 w-6 text-yellow-500" />
                        ¡Conflicto de Agendamiento!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="pt-4">
                        La cita para <strong>{rescheduleAppointment.patientName}</strong> a las <strong>{format(rescheduleAppointment.appointmentDate.toDate(), "p", { locale: es })}</strong> del <strong>{format(rescheduleAppointment.appointmentDate.toDate(), "d 'de' MMMM", { locale: es })}</strong> tiene un conflicto con otra cita.
                        <br /><br />
                        Por favor, cancele esta solicitud y pida al paciente que elija otro horario, o póngase en contacto con el paciente para reagendarla manualmente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setRescheduleAppointment(null)}>Entendido</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      )}

    </div>
  );
}
