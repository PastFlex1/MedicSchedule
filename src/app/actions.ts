'use server';

import { confirmAppointment, type ConfirmAppointmentInput, type ConfirmAppointmentOutput } from '@/ai/flows/smart-appointment-confirmation';

export async function handleAppointmentRequest(
  formData: { patientName: string; contactNumber: string; requirements?: string },
  appointmentDetails: { appointmentDate: string; appointmentTime: string; doctorName: string; }
): Promise<ConfirmAppointmentOutput> {
  const availabilityCalendar = `
    Doctor Availability Calendar:
    - Dr. Sarah Johnson: Available on 2024-10-26 from 09:00 to 12:00 and 14:00 to 17:00. Unavailable on weekends.
    - Dr. Mark Smith: Available on 2024-10-28 from 10:00 to 13:00.
    - Dr. Emily White: Fully booked for the next two weeks.
    - Dr. David Chen: Available on 2024-10-26 from 10:00 to 15:00.
  `;

  const input: ConfirmAppointmentInput = {
    ...formData,
    ...appointmentDetails,
    availabilityCalendar,
  };

  try {
    const result = await confirmAppointment(input);
    return result;
  } catch (error) {
    console.error("Error calling AI flow:", error);
    return {
      confirmationStatus: false,
      reason: "An internal error occurred. Please try again later.",
    };
  }
}
