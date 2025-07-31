import type { Doctor, AppointmentSlot as AppointmentSlotType } from '@/lib/types';
import { AppointmentBooking } from './appointment-booking';
import { PlusCircle } from 'lucide-react';

function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <PlusCircle className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline text-primary- L-tracking-tight">
          MediSchedule
        </h1>
      </div>
    </header>
  );
}

const doctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'HeartPulse',
    dataAiHint: 'doctor portrait',
  },
  {
    id: '2',
    name: 'Dr. Mark Smith',
    specialty: 'Orthopedics',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'Bone',
    dataAiHint: 'doctor portrait',
  },
  {
    id: '3',
    name: 'Dr. Emily White',
    specialty: 'Neurology',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'Brain',
    dataAiHint: 'doctor portrait',
  },
  {
    id: '4',
    name: 'Dr. David Chen',
    specialty: 'General Practice',
    avatarUrl: 'https://placehold.co/100x100.png',
    icon: 'Stethoscope',
    dataAiHint: 'doctor portrait',
  },
];

const appointmentSlots: AppointmentSlotType[] = [
  { id: '101', date: new Date('2024-10-26T09:00:00'), doctorId: '1' },
  { id: '102', date: new Date('2024-10-26T09:30:00'), doctorId: '1' },
  { id: '103', date: new Date('2024-10-26T10:00:00'), doctorId: '4' },
  { id: '104', date: new Date('2024-10-26T11:00:00'), doctorId: '4' },
  { id: '105', date: new Date('2024-10-28T10:00:00'), doctorId: '2' },
  { id: '106', date: new Date('2024-10-28T10:30:00'), doctorId: '2' },
  { id: '107', date: new Date('2024-10-26T14:00:00'), doctorId: '1' },
  { id: '108', date: new Date('2024-10-28T11:30:00'), doctorId: '2' },
];


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8">
        <AppointmentBooking doctors={doctors} appointmentSlots={appointmentSlots} />
      </main>
      <footer className="bg-card mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
