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

export interface ConfirmAppointmentInput {
  patientName: string;
  contactNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorName: string;
  requirements?: string;
}

export interface ConfirmAppointmentOutput {
  confirmationStatus: boolean;
  reason: string;
  suggestedAlternative?: string;
}
