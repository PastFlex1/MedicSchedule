"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stethoscope, User } from 'lucide-react';

export default function LoginPage() {
  const [userType, setUserType] = useState("patient");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === "patient") {
      router.push('/paciente');
    } else {
      router.push('/doctor');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
       <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Stethoscope className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>Iniciar Sesión en MediSchedule</CardTitle>
          <CardDescription>Seleccione su rol para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <RadioGroup defaultValue="patient" onValueChange={setUserType} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="patient" id="patient" className="peer sr-only" />
                <Label
                  htmlFor="patient"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <User className="mb-3 h-6 w-6" />
                  Paciente
                </Label>
              </div>
              <div>
                <RadioGroupItem value="doctor" id="doctor" className="peer sr-only" />
                <Label
                  htmlFor="doctor"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Stethoscope className="mb-3 h-6 w-6" />
                  Doctor
                </Label>
              </div>
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="email@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Ingresar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>Esta es una demostración. No se necesita un correo electrónico o contraseña real.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
