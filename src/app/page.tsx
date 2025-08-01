
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, User } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-primary tracking-tight">
              MediSchedule
            </h1>
          </div>
          <Button asChild>
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-bold font-headline mb-4">Bienvenido a MediSchedule</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Tu asistente para la gestión de citas médicas. Inicia sesión para comenzar.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="text-primary"/> Para Pacientes</CardTitle>
                <CardDescription>Encuentra especialistas y reserva tu cita en segundos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-left text-sm text-muted-foreground space-y-2">
                  <li>Busca doctores por especialidad.</li>
                  <li>Ve los horarios disponibles en tiempo real.</li>
                  <li>Recibe confirmaciones de tu cita.</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Stethoscope className="text-primary"/> Para Doctores</CardTitle>
                <CardDescription>Gestiona tu agenda y confirma citas de forma eficiente.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-left text-sm text-muted-foreground space-y-2">
                  <li>Revisa las solicitudes de citas pendientes.</li>
                  <li>Confirma o sugiere nuevos horarios con un solo clic.</li>
                  <li>Optimiza la gestión de tu calendario.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="bg-card mt-12">
        <div className="container mx-auto py-4 px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} MediSchedule. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

