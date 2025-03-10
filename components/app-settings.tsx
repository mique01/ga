"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"

export default function AppSettings() {
  const { toast } = useToast()
  const [livingStatus, setLivingStatus] = useState<"solo" | "acompañado">("solo")

  // Cargar configuración desde localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings")

    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      if (settings.livingStatus) {
        setLivingStatus(settings.livingStatus)
      }
    }
  }, [])

  // Guardar configuración en localStorage cuando cambia
  useEffect(() => {
    const settings = {
      livingStatus,
    }
    localStorage.setItem("appSettings", JSON.stringify(settings))

    // Mostrar toast solo cuando cambia después de la carga inicial
    if (typeof window !== "undefined" && document.readyState === "complete") {
      toast({
        title: "Configuración guardada",
        description: "Tus preferencias han sido actualizadas",
      })
    }
  }, [livingStatus, toast])

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de la Aplicación</CardTitle>
          <CardDescription>Personaliza el funcionamiento de tu aplicación de seguimiento financiero</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="living-status">Situación de Vivienda</Label>
              <RadioGroup
                id="living-status"
                value={livingStatus}
                onValueChange={(value) => setLivingStatus(value as "solo" | "acompañado")}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="solo" id="solo" />
                  <Label htmlFor="solo" className="cursor-pointer">
                    Vivo solo
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="acompañado" id="acompañado" />
                  <Label htmlFor="acompañado" className="cursor-pointer">
                    Vivo acompañado
                  </Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-muted-foreground">
                {livingStatus === "solo"
                  ? "No se mostrará la opción para asignar gastos a diferentes personas."
                  : "Se habilitará la opción para asignar gastos a diferentes personas."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

