
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Stethoscope, LogOut, User, Calendar, Clock, Check, X, AlertCircle, PartyPopper, Loader2, PlusCircle, Trash2, RefreshCw } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, Timestamp, getDocs } from 'firebase/firestore';
import type { Appointment, AppointmentSlot, Doctor } from '@/lib/types';
import { format, setHours, setMinutes, startOfDay, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { handleCancelAppointment, handleCreateSlot, handleDeleteSlot, handleReschedule } from '../actions';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">
            MediSchedule - Portal de Administración
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

function SlotManager({ doctorId }: { doctorId: string | undefined }) {
    const [date, setDate] = useState<Date | undefined>();
    const [time, setTime] = useState("09:00");
    const [allSlots, setAllSlots] = useState<AppointmentSlot[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setDate(new Date());
    }, []);

    useEffect(() => {
        if (!doctorId) {
            setAllSlots([]);
            return;
        }
        const q = query(
            collection(db, "appointmentSlots"),
            where("doctorId", "==", doctorId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const slotsData = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                    id: doc.id,
                    ...data,
                    date: (data.date as Timestamp).toDate(),
                } as AppointmentSlot
            });
            setAllSlots(slotsData);
        });
        
        return () => unsubscribe();
    }, [doctorId]);
    
    const availableSlots = useMemo(() => {
        if (!date) return [];
        return allSlots
            .filter(slot => isSameDay(slot.date, date))
            .sort((a,b) => a.date.getTime() - b.date.getTime());
    }, [allSlots, date]);

    const handleAddSlot = async () => {
        if (!date || !time || !doctorId) {
            toast({ title: "Error", description: "Por favor, seleccione un doctor, una fecha y una hora.", variant: "destructive" });
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const newDate = setMinutes(setHours(date, hours), minutes);
        
        setIsLoading(true);
        const result = await handleCreateSlot(doctorId, newDate);
        setIsLoading(false);

        toast({
            title: result.success ? "Éxito" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });
    };

    const handleDelete = async (slotId: string) => {
       const result = await handleDeleteSlot(slotId);
       toast({
           title: result.success ? "Éxito" : "Error",
           description: result.message,
           variant: result.success ? "default" : "destructive"
       });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestionar Horarios Disponibles</CardTitle>
                <CardDescription>Añada o elimine los horarios de consulta para el doctor seleccionado. Los pacientes los verán en tiempo real.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-4">
                     <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={(day) => day && setDate(day)}
                        className="rounded-md border"
                        locale={es}
                        disabled={(date) => date < startOfDay(new Date()) || !doctorId}
                        initialFocus
                      />
                      <div className="flex items-center gap-2">
                        <Input 
                            type="time" 
                            value={time} 
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full"
                            disabled={!doctorId}
                        />
                        <Button onClick={handleAddSlot} disabled={isLoading || !doctorId}>
                           {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                            Añadir
                        </Button>
                      </div>
                </div>
                <div className="space-y-4">
                    <h4 className="font-semibold text-center md:text-left">
                        Horarios para {date ? format(date, "d 'de' MMMM", { locale: es }) : '...'}
                    </h4>
                    {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {availableSlots.map(slot => (
                                <Badge key={slot.id} variant="outline" className="flex justify-between items-center py-2 px-3">
                                    <Clock className="h-4 w-4 mr-2" />
                                    {format(slot.date, "p", { locale: es })}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 hover:bg-destructive/10" onClick={() => handleDelete(slot.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                         <div className="text-sm text-muted-foreground text-center pt-8 h-full flex items-center justify-center">
                           {!doctorId ? <p>Seleccione un doctor para ver sus horarios.</p> : <p>No hay horarios disponibles para este día.</p> }
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function RescheduleDialog({ appointment, open, onOpenChange, onRescheduled }: { appointment: Appointment | null, open: boolean, onOpenChange: (open: boolean) => void, onRescheduled: () => void }) {
    const [date, setDate] = useState<Date | undefined>();
    const [time, setTime] = useState("09:00");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if(appointment) {
            setDate(appointment.appointmentDate);
            setTime(format(appointment.appointmentDate, "HH:mm"));
        }
    }, [appointment]);

    const handleConfirmReschedule = async () => {
        if (!appointment || !date || !time) return;

        const [hours, minutes] = time.split(':').map(Number);
        const newDate = setMinutes(setHours(date, hours), minutes);

        setIsLoading(true);
        const result = await handleReschedule(appointment.id!, newDate);
        setIsLoading(false);

        toast({
            title: result.success ? "Éxito" : "Error",
            description: result.message,
            variant: result.success ? "default" : "destructive",
        });

        if (result.success) {
            onRescheduled();
        }
    }

    if (!appointment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reprogramar Cita</DialogTitle>
                    <DialogDescription>
                        Seleccione una nueva fecha y hora para la cita de <strong>{appointment.patientName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        locale={es}
                        disabled={(date) => date < startOfDay(new Date())}
                      />
                      <div className="flex items-center gap-2">
                        <Label htmlFor="time" className="sr-only">Hora</Label>
                        <Input 
                            id="time"
                            type="time" 
                            value={time} 
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full"
                        />
                      </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleConfirmReschedule} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Reprogramación
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function DoctorPage() {
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [approvedAppointments, setApprovedAppointments] = useState<Appointment[]>([]);
  const [rescheduleAppointments, setRescheduleAppointments] = useState<Appointment[]>([]);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null);
  const [conflictAppointment, setConflictAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>();

  useEffect(() => {
    const fetchDoctors = async () => {
      const doctorsCol = collection(db, 'doctors');
      const doctorSnapshot = await getDocs(doctorsCol);
      const doctorList = doctorSnapshot.docs.map(doc => doc.data() as Doctor);
      setDoctors(doctorList);
      if(doctorList.length > 0) {
        //   setSelectedDoctorId(doctorList[0].id);
      }
    };
    fetchDoctors();
  }, []);

  const selectedDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);


  useEffect(() => {
    if (!selectedDoctorId) {
      setPendingAppointments([]);
      setApprovedAppointments([]);
      setRescheduleAppointments([]);
      setIsLoading(false);
      return;
    };

    setIsLoading(true);

    const q = query(
      collection(db, "appointments"),
      where("doctor.id", "==", selectedDoctorId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const pending: Appointment[] = [];
      const approved: Appointment[] = [];
      const reschedule: Appointment[] = [];
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
        } else if (appointment.status === 'reschedule-requested') {
          reschedule.push(appointment);
        }
      });
      setPendingAppointments(pending.sort((a,b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
      setApprovedAppointments(approved.sort((a,b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
      setRescheduleAppointments(reschedule.sort((a,b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDoctorId]);

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

  const handleRescheduleClick = (appointment: Appointment) => {
    setAppointmentToReschedule(appointment);
  }

  const handleRejectReschedule = async (appointmentId: string) => {
      if(!appointmentId) return;
      const appointmentRef = doc(db, 'appointments', appointmentId);
      // Revert status to 'approved'
      await updateDoc(appointmentRef, { status: 'approved' });
      toast({
          title: "Solicitud Rechazada",
          description: "La solicitud de reprogramación ha sido rechazada y la cita vuelve a estar aprobada.",
      });
  }

  const hasConflict = (pendingAppointment: Appointment): boolean => {
    return approvedAppointments.some(
      approved => approved.appointmentDate.getTime() === pendingAppointment.appointmentDate.getTime()
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        
        <Card>
            <CardHeader>
                <CardTitle>Seleccionar Doctor</CardTitle>
                <CardDescription>Elija un doctor para gestionar su calendario y sus citas.</CardDescription>
            </CardHeader>
            <CardContent>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                    <SelectTrigger className="w-full md:w-1/2">
                        <SelectValue placeholder="Seleccione un doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                        {doctors.map(doctor => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                               <div className="flex items-center gap-3">
                                 <Avatar className="w-8 h-8">
                                    <AvatarImage src={doctor.avatarUrl} alt={doctor.name} />
                                    <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{doctor.name}</p>
                                    <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                                </div>
                               </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>

        <SlotManager doctorId={selectedDoctorId} />

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Citas Pendientes</CardTitle>
            <CardDescription>
              {selectedDoctor ? `Mostrando solicitudes para ${selectedDoctor.name}.` : 'Seleccione un doctor para ver las solicitudes.'}
            </CardDescription>
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
                ) : !selectedDoctorId ? (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                            Seleccione un doctor para ver las citas pendientes.
                        </TableCell>
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
                      No hay citas pendientes para este doctor.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Reprogramación</CardTitle>
            <CardDescription>
              {selectedDoctor ? `Mostrando solicitudes para ${selectedDoctor.name}.` : 'Seleccione un doctor para ver las solicitudes.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha Actual</TableHead>
                  <TableHead>Hora Actual</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">Cargando...</TableCell>
                    </TableRow>
                ) : !selectedDoctorId ? (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                            Seleccione un doctor para ver las solicitudes.
                        </TableCell>
                    </TableRow>
                ) : rescheduleAppointments.length > 0 ? (
                  rescheduleAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className="bg-blue-500/10">
                      <TableCell className="font-medium">{appointment.patientName}</TableCell>
                      <TableCell>{format(appointment.appointmentDate, "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                      <TableCell>{format(appointment.appointmentDate, "p", { locale: es })}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white" onClick={() => handleRescheduleClick(appointment)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reagendar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleRejectReschedule(appointment.id!)}>
                          Rechazar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No hay solicitudes de reprogramación.
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
            <CardDescription>
                {selectedDoctor ? `Mostrando citas aprobadas para ${selectedDoctor.name}.` : 'Seleccione un doctor para ver las citas aprobadas.'}
            </CardDescription>
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
            ) : !selectedDoctorId ? (
                <div className="text-center py-12 text-muted-foreground col-span-1 flex items-center justify-center">
                    <p>Seleccione un doctor.</p>
                </div>
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
                <div className="text-center py-12 text-muted-foreground col-span-1 flex items-center justify-center">
                    <p>Aún no hay citas aprobadas para este doctor.</p>
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

      <RescheduleDialog
        appointment={appointmentToReschedule}
        open={!!appointmentToReschedule}
        onOpenChange={() => setAppointmentToReschedule(null)}
        onRescheduled={() => setAppointmentToReschedule(null)}
      />


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
                    <AlertDialogAction onClick={handleConfirmCancel} disabled={isCancelling} className={cn(buttonVariants({ variant: "destructive" }))}>
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

    
