import type { icons } from 'lucide-react';

export type IconName = keyof typeof icons;

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  icon: IconName;
  dataAiHint: string;
}

export interface AppointmentSlot {
  id: string;
  date: Date;
  doctorId: string;
}

export interface BookedAppointment extends AppointmentSlot {
  doctor: Doctor;
}
