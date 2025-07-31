import type { icons } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

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

// This represents the data structure in Firestore
export interface Appointment {
  id?: string; // Firestore document ID
  patientName: string;
  contactNumber: string;
  requirements?: string;
  appointmentDate: Timestamp;
  doctor: {
    id: string;
    name: string;
    specialty: string;
  };
  status: 'pending' | 'approved' | 'cancelled';
  createdAt: Timestamp;
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
