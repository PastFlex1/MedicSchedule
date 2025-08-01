
'use server';

import type { ConfirmAppointmentOutput } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, deleteDoc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export async function handleAppointmentRequest(
  formData: { patientName: string; contactNumber: string; requirements?: string },
  appointmentDetails: { appointmentDate: Date; doctor: { id: string; name: string; specialty: string; }; patientId: string;}
): Promise<ConfirmAppointmentOutput> {

  const { patientId, doctor, appointmentDate } = appointmentDetails;

  try {
    // El estado se establece en 'pending' para requerir la aprobación del doctor.
    // Se puede cambiar a 'approved' para una confirmación instantánea.
    await addDoc(collection(db, "appointments"), {
        ...formData,
        appointmentDate: Timestamp.fromDate(appointmentDate),
        doctor: {
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty
        },
        patientId: patientId, // En una app real, este sería el ID del usuario autenticado
        status: 'pending', 
        createdAt: Timestamp.now()
    });
    
    return {
        confirmationStatus: true,
        reason: "Tu solicitud ha sido enviada. El doctor la revisará y recibirás una notificación cuando sea aprobada.",
    };

  } catch (error) {
    console.error("Error creating appointment request:", error);
    return {
      confirmationStatus: false,
      reason: "Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.",
    };
  }
}


export async function handleCancelAppointment(appointmentId: string, doctorId: string, appointmentDate: Date): Promise<{ success: boolean; message: string }> {
  if (!appointmentId || !doctorId || !appointmentDate) {
    return { success: false, message: "Faltan datos para la cancelación." };
  }

  try {
    // 1. Eliminar el documento de la cita
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await deleteDoc(appointmentRef);

    // 2. Volver a crear el horario disponible
    // Esto crea un ID único basado en el doctor y la hora para evitar duplicados
    const slotId = `${doctorId}_${appointmentDate.toISOString()}`;
    const slotRef = doc(db, "appointmentSlots", slotId);
    
    // Comprobar si el horario ya existe para evitar sobreescrituras accidentales
    const slotSnap = await getDoc(slotRef);
    if (!slotSnap.exists()) {
       await setDoc(slotRef, {
        doctorId: doctorId,
        date: Timestamp.fromDate(appointmentDate)
      });
    }

    return { success: true, message: "La cita ha sido cancelada exitosamente." };
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return { success: false, message: "Ocurrió un error al cancelar la cita." };
  }
}

export async function handleCreateSlot(doctorId: string, date: Date): Promise<{ success: boolean; message: string }> {
  if (!doctorId || !date) {
    return { success: false, message: "Faltan datos para crear el horario." };
  }
  
  try {
    const slotId = `${doctorId}_${date.toISOString()}`;
    const slotRef = doc(db, "appointmentSlots", slotId);
    
    const slotSnap = await getDoc(slotRef);
    if (slotSnap.exists()) {
      return { success: false, message: "Este horario ya existe." };
    }

    await setDoc(slotRef, {
      doctorId,
      date: Timestamp.fromDate(date)
    });

    return { success: true, message: "Horario creado exitosamente." };
  } catch (error) {
    console.error("Error creating slot:", error);
    return { success: false, message: "Ocurrió un error al crear el horario." };
  }
}


export async function handleDeleteSlot(slotId: string): Promise<{ success: boolean; message: string }> {
  if (!slotId) {
    return { success: false, message: "Falta el ID del horario." };
  }
  
  try {
    const slotRef = doc(db, "appointmentSlots", slotId);
    await deleteDoc(slotRef);
    return { success: true, message: "Horario eliminado exitosamente." };
  } catch (error) {
    console.error("Error deleting slot:", error);
    return { success: false, message: "Ocurrió un error al eliminar el horario." };
  }
}

export async function handleRequestReschedule(appointmentId: string): Promise<{ success: boolean; message: string }> {
    if (!appointmentId) {
        return { success: false, message: "Falta el ID de la cita." };
    }
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, { status: 'reschedule-requested' });
        return { success: true, message: "Tu solicitud para posponer la cita ha sido enviada al doctor." };
    } catch (error) {
        console.error("Error requesting reschedule:", error);
        return { success: false, message: "Ocurrió un error al enviar tu solicitud." };
    }
}

export async function handleReschedule(appointmentId: string, newDate: Date): Promise<{ success: boolean; message: string }> {
    if (!appointmentId || !newDate) {
        return { success: false, message: "Faltan datos para reagendar." };
    }
    try {
        const appointmentRef = doc(db, 'appointments', appointmentId);
        await updateDoc(appointmentRef, {
            status: 'approved',
            appointmentDate: Timestamp.fromDate(newDate)
        });
        return { success: true, message: "La cita ha sido reagendada exitosamente." };
    } catch (error) {
        console.error("Error rescheduling appointment:", error);
        return { success: false, message: "Ocurrió un error al reagendar la cita." };
    }
}

