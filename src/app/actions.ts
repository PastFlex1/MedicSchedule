'use server';

import type { ConfirmAppointmentOutput } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function handleAppointmentRequest(
  formData: { patientName: string; contactNumber: string; requirements?: string },
  appointmentDetails: { appointmentDate: Date; doctor: { id: string; name: string; specialty: string; }; patientId: string;}
): Promise<ConfirmAppointmentOutput> {

  const { patientId, doctor, appointmentDate } = appointmentDetails;

  try {
    await addDoc(collection(db, "appointments"), {
        ...formData,
        appointmentDate: Timestamp.fromDate(appointmentDate),
        doctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty
        },
        patientId: patientId, // In a real app, this would be the authenticated user's ID
        status: 'approved', // The appointment is approved instantly
        createdAt: Timestamp.now()
    });
    
    return {
        confirmationStatus: true,
        reason: "¡Su cita ha sido confirmada! Recibirá un recordatorio por correo electrónico o SMS.",
    };

  } catch (error) {
    console.error("Error creating appointment request:", error);
    return {
      confirmationStatus: false,
      reason: "Ocurrió un error al procesar su solicitud. Por favor, inténtelo de nuevo más tarde.",
    };
  }
}
