import type { Doctor, AppointmentSlot as AppointmentSlotType } from '@/lib/types';
import { AppointmentBooking } from '../appointment-booking';
import { Stethoscope, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

const doctors: Doctor[] = [
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

const appointmentSlots: AppointmentSlotType[] = [
  { id: '101', date: new Date(2024, 9, 26, 9, 0, 0), doctorId: '1' }, // October is month 9 (0-indexed)
  { id: '102', date: new Date(2024, 9, 26, 9, 30, 0), doctorId: '1' },
  { id: '103', date: new Date(2024, 9, 26, 10, 0, 0), doctorId: '4' },
  { id: '104', date: new Date(2024, 9, 26, 11, 0, 0), doctorId: '4' },
  { id: '105', date: new Date(2024, 9, 28, 10, 0, 0), doctorId: '2' },
  { id: '106', date: new Date(2024, 9, 28, 10, 30, 0), doctorId: '2' },
  { id: '107', date: new Date(2024, 9, 26, 14, 0, 0), doctorId: '1' },
  { id: '108', date: new Date(2024, 9, 28, 11, 30, 0), doctorId: '2' },
];


export default function PatientPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <AppointmentBooking doctors={doctors} appointmentSlots={appointmentSlots} />
      </main>
      <footer className="bg-card mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
