"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function PeopleManager() {
  const { toast } = useToast()
  const [people, setPeople] = useState<string[]>([])
  const [newPerson, setNewPerson] = useState("")
  const [expenses, setExpenses] = useState<any[]>([])
  const [personToDelete, setPersonToDelete] = useState<string | null>(null)

  // Cargar datos desde localStorage
  useEffect(() => {
    const savedPeople = localStorage.getItem("people")
    const savedExpenses = localStorage.getItem("expenses")

    if (savedPeople) setPeople(JSON.parse(savedPeople))
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses))
  }, [])

  // Guardar personas en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem("people", JSON.stringify(people))
  }, [people])

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPerson.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la persona",
        variant: "destructive",
      })
      return
    }

    if (people.includes(newPerson.trim())) {
      toast({
        title: "Error",
        description: "Esta persona ya existe",
        variant: "destructive",
      })
      return
    }

    setPeople([...people, newPerson.trim()])
    setNewPerson("")

    toast({
      title: "Persona agregada",
      description: "La persona ha sido agregada correctamente",
    })
  }

  const confirmDeletePerson = (person: string) => {
    setPersonToDelete(person)
  }

  const handleDeletePerson = () => {
    if (!personToDelete) return

    // Verificar si hay gastos con esta persona
    const hasExpenses = expenses.some((expense) => expense.person === personToDelete)

    if (hasExpenses) {
      // Actualizar los gastos que usan esta persona
      const updatedExpenses = expenses.map((expense) => {
        if (expense.person === personToDelete) {
          return { ...expense, person: "Sin asignar" }
        }
        return expense
      })

      setExpenses(updatedExpenses)
      localStorage.setItem("expenses", JSON.stringify(updatedExpenses))
    }

    // Eliminar la persona
    setPeople(people.filter((p) => p !== personToDelete))

    toast({
      title: "Persona eliminada",
      description: "La persona ha sido eliminada correctamente",
    })

    setPersonToDelete(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Personas</CardTitle>
          <CardDescription>Agrega o elimina personas que comparten gastos contigo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPerson} className="flex gap-2 mb-6">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="new-person">Nueva Persona</Label>
              <Input
                id="new-person"
                value={newPerson}
                onChange={(e) => setNewPerson(e.target.value)}
                placeholder="Ej: Juan, María, Carlos"
              />
            </div>
            <Button type="submit" className="mt-8">
              Agregar
            </Button>
          </form>

          {people.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de la Persona</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => (
                  <TableRow key={person}>
                    <TableCell>{person}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => confirmDeletePerson(person)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Los gastos asociados a esta persona se marcarán como
                              "Sin asignar".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeletePerson}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay personas disponibles. Agrega una nueva persona para comenzar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

