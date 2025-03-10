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

export default function PaymentMethodManager() {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [newPaymentMethod, setNewPaymentMethod] = useState("")
  const [expenses, setExpenses] = useState<any[]>([])
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null)

  // Cargar datos desde localStorage
  useEffect(() => {
    const savedPaymentMethods = localStorage.getItem("paymentMethods")
    const savedExpenses = localStorage.getItem("expenses")

    if (savedPaymentMethods) setPaymentMethods(JSON.parse(savedPaymentMethods))
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses))
  }, [])

  // Guardar métodos de pago en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem("paymentMethods", JSON.stringify(paymentMethods))
  }, [paymentMethods])

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPaymentMethod.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para el método de pago",
        variant: "destructive",
      })
      return
    }

    if (paymentMethods.includes(newPaymentMethod.trim())) {
      toast({
        title: "Error",
        description: "Este método de pago ya existe",
        variant: "destructive",
      })
      return
    }

    setPaymentMethods([...paymentMethods, newPaymentMethod.trim()])
    setNewPaymentMethod("")

    toast({
      title: "Método de pago agregado",
      description: "El método de pago ha sido agregado correctamente",
    })
  }

  const confirmDeletePaymentMethod = (method: string) => {
    setMethodToDelete(method)
  }

  const handleDeletePaymentMethod = () => {
    if (!methodToDelete) return

    // Verificar si hay gastos con este método de pago
    const hasExpenses = expenses.some((expense) => expense.paymentMethod === methodToDelete)

    if (hasExpenses) {
      // Actualizar los gastos que usan este método de pago
      const updatedExpenses = expenses.map((expense) => {
        if (expense.paymentMethod === methodToDelete) {
          return { ...expense, paymentMethod: "Efectivo" }
        }
        return expense
      })

      setExpenses(updatedExpenses)
      localStorage.setItem("expenses", JSON.stringify(updatedExpenses))
    }

    // Eliminar el método de pago
    setPaymentMethods(paymentMethods.filter((method) => method !== methodToDelete))

    toast({
      title: "Método de pago eliminado",
      description: "El método de pago ha sido eliminado correctamente",
    })

    setMethodToDelete(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Métodos de Pago</CardTitle>
          <CardDescription>Agrega o elimina métodos de pago para tus gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPaymentMethod} className="flex gap-2 mb-6">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="new-payment-method">Nuevo Método de Pago</Label>
              <Input
                id="new-payment-method"
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                placeholder="Ej: Tarjeta de Crédito, Efectivo, Transferencia"
              />
            </div>
            <Button type="submit" className="mt-8">
              Agregar
            </Button>
          </form>

          {paymentMethods.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Método de Pago</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentMethods.map((method) => (
                  <TableRow key={method}>
                    <TableCell>{method}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => confirmDeletePaymentMethod(method)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Los gastos que usan este método de pago se marcarán como
                              "Efectivo".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeletePaymentMethod}>Eliminar</AlertDialogAction>
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
              No hay métodos de pago disponibles. Agrega un nuevo método de pago para comenzar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

