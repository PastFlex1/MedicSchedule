
"use client";

import { useState, useEffect } from 'react';
import type { Doctor, BookedAppointment, AppointmentSlot } from '@/lib/types';
import { AppointmentBooking } from '../appointment-booking';
import { Stethoscope, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, onSnapshot, Timestamp, writeBatch } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const initialDoctors: Omit<Doctor, 'id'>[] = [
  {
    name: 'Dra. Sarah Johnson',
    specialty: 'Cardiología',
    avatarUrl: 'https://images.pexels.com/photos/5206931/pexels-photo-5206931.jpeg',
    icon: 'HeartPulse',
    dataAiHint: 'doctor portrait',
  },
  {
    name: 'Dr. Mark Smith',
    specialty: 'Ortopedia',
    avatarUrl: 'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg',
    icon: 'ClipboardPen',
    dataAiHint: 'doctor portrait',
  },
  {
    name: 'Dra. Emily White',
    specialty: 'Neurología',
    avatarUrl: 'https://images.pexels.com/photos/32115955/pexels-photo-32115955.jpeg',
    icon: 'Brain',
    dataAiHint: 'doctor portrait',
  },
  {
    name: 'Dr. David Chen',
    specialty: 'Medicina General',
    avatarUrl: 'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg',
    icon: 'Stethoscope',
    dataAiHint: 'doctor portrait',
  },
  {
    name: 'Dra. Ana Pérez',
    specialty: 'Odontología',
    avatarUrl: 'https://images.pexels.com/photos/7578810/pexels-photo-7578810.jpeg',
    icon: 'ToothIcon', 
    dataAiHint: 'dentist portrait',
  },
  {
    name: 'Dra. Mónica Tapia',
    specialty: 'Obstetricia',
    avatarUrl: 'https://images.pexels.com/photos/6011604/pexels-photo-6011604.jpeg',
    icon: 'PersonStanding',
    dataAiHint: 'doctor portrait woman',
  },
];

const initialAppointmentSlots: Omit<AppointmentSlot, 'id' | 'date'> & { date: Date }[] = [
    // Dr. Johnson
    { date: new Date(new Date().setHours(9, 0, 0, 0)), doctorId: '1' },
    { date: new Date(new Date().setHours(9, 30, 0, 0)), doctorId: '1' },
    { date: new Date(new Date().setHours(14, 0, 0, 0)), doctorId: '1' },
    // Dr. Smith
    { date: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(10, 0, 0, 0)), doctorId: '2' },
    { date: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(10, 30, 0, 0)), doctorId: '2' },
    { date: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(11, 30, 0, 0)), doctorId: '2' },
    // Dr. Chen
    { date: new Date(new Date().setHours(10, 0, 0, 0)), doctorId: '4' },
    { date: new Date(new Date().setHours(11, 0, 0, 0)), doctorId: '4' },
];


function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">
            MediSchedule
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

function LoadingSkeleton() {
    return (
        <div className="space-y-16">
            <section className="text-center">
                <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-60" />)}
                </div>
            </section>
            <section className="text-center">
                <Skeleton className="h-8 w-1/2 mx-auto mb-2" />
                <Skeleton className="h-4 w-3/4 mx-auto mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                     {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
            </section>
        </div>
    )
}


export default function PatientPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // This is a temporary user ID for demonstration purposes.
  // In a real app, you would get this from your authentication system.
  const FAKE_USER_ID = "patient123";

  useEffect(() => {
    const seedAndFetchData = async () => {
      setIsLoading(true);
      
      const doctorsCol = collection(db, 'doctors');
      
      // --- Force update doctors from initialDoctors array ---
      const batch = writeBatch(db);
      const finalDoctorList: Doctor[] = [];
      for (let i = 0; i < initialDoctors.length; i++) {
        const id = (i + 1).toString();
        const doctorData = { ...initialDoctors[i], id };
        const docRef = doc(db, 'doctors', id);
        batch.set(docRef, doctorData);
        finalDoctorList.push(doctorData);
      }
      await batch.commit();
      
      // Set the state with the most up-to-date doctor list
      setDoctors(finalDoctorList);
      
      const doctorMap = new Map(finalDoctorList.map(doc => [doc.id, doc]));

      // Fetch or seed slots
      const slotsCol = collection(db, 'appointmentSlots');
      const slotSnapshot = await getDocs(slotsCol);
      if (slotSnapshot.empty) {
        for (const slot of initialAppointmentSlots) {
          const slotId = `${slot.doctorId}_${slot.date.toISOString()}`;
          await setDoc(doc(db, 'appointmentSlots', slotId), { ...slot, date: Timestamp.fromDate(slot.date) });
        }
      } 
      
      // We are going to listen for slot changes in real time
      const unsubscribeSlots = onSnapshot(slotsCol, (snapshot) => {
        const slotList = snapshot.docs.map(doc => {
            const data = doc.data();
            return { id: doc.id, ...data, date: (data.date as Timestamp).toDate() } as AppointmentSlot;
        });
        setAppointmentSlots(slotList);
      });

      // Listen for changes in the user's appointments
        const q = query(collection(db, "appointments"), where("patientId", "==", FAKE_USER_ID));
        const unsubscribeAppointments = onSnapshot(q, (querySnapshot) => {
          const appointments: BookedAppointment[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const doctor = doctorMap.get(data.doctor.id);
            if (doctor) {
                appointments.push({
                    id: doc.id,
                    date: (data.appointmentDate as Timestamp).toDate(),
                    doctorId: data.doctor.id,
                    doctor: doctor,
                    status: data.status,
                } as BookedAppointment);
            }
          });
          setBookedAppointments(appointments);
          setIsLoading(false);
        });

      return () => {
        unsubscribeSlots();
        unsubscribeAppointments();
      };
    };
    
    seedAndFetchData();
  }, []);


  const handleAppointmentBooked = (slotId: string) => {
    // This is now handled by real-time listeners, but we can still force a local state update
    // for a more snappy UI if needed, though it's not strictly necessary with onSnapshot.
    setAppointmentSlots(prevSlots => prevSlots.filter(slot => slot.id !== slotId));
  };


  if (isLoading) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
                <LoadingSkeleton />
            </main>
        </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <AppointmentBooking 
          doctors={doctors}
          appointmentSlots={appointmentSlots}
          onAppointmentBooked={handleAppointmentBooked}
          bookedAppointments={bookedAppointments}
          patientId={FAKE_USER_ID}
        />
      </main>
      <footer className="bg-card mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
