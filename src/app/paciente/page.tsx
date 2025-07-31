
"use client";

import { useState, useEffect } from 'react';
import type { Doctor, Appointment, BookedAppointment } from '@/lib/types';
import { AppointmentBooking } from '../appointment-booking';
import { Stethoscope, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, onSnapshot } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const initialDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dra. Sarah Johnson',
    specialty: 'Cardiología',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'HeartPulse',
    dataAiHint: 'doctor portrait',
  },
  {
    id: '2',
    name: 'Dr. Mark Smith',
    specialty: 'Ortopedia',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'Bone',
    dataAiHint: 'doctor portrait',
  },
  {
    id: '3',
    name: 'Dra. Emily White',
    specialty: 'Neurología',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'Brain',
    dataAiHint: 'doctor portrait',
  },
  {
    id: '4',
    name: 'Dr. David Chen',
    specialty: 'Medicina General',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'Stethoscope',
    dataAiHint: 'doctor portrait',
  },
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
  const [bookedAppointments, setBookedAppointments] = useState<BookedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // This is a temporary user ID for demonstration purposes.
  // In a real app, you would get this from your authentication system.
  const FAKE_USER_ID = "patient123";

  useEffect(() => {
    const fetchDoctors = async () => {
      const doctorsCol = collection(db, 'doctors');
      const doctorSnapshot = await getDocs(doctorsCol);
      if (doctorSnapshot.empty) {
        // Seed doctors if collection is empty
        for (const doctor of initialDoctors) {
          await setDoc(doc(db, 'doctors', doctor.id), doctor);
        }
        setDoctors(initialDoctors);
      } else {
        const doctorList = doctorSnapshot.docs.map(doc => doc.data() as Doctor);
        setDoctors(doctorList);
      }
    };
    
    fetchDoctors();

    // Listen for changes in the user's appointments
    const q = query(collection(db, "appointments"), where("patientId", "==", FAKE_USER_ID));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointments: BookedAppointment[] = [];
      const fetchedDoctors = new Map(doctors.map(doc => [doc.id, doc]));

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const doctor = fetchedDoctors.get(data.doctor.id);
        if (doctor) {
            appointments.push({
                id: doc.id,
                date: data.appointmentDate.toDate(),
                doctorId: data.doctor.id,
                doctor: doctor,
            });
        }
      });
      setBookedAppointments(appointments);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [doctors]);


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
          onAppointmentBooked={() => {}} // The onSnapshot now handles updates
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
