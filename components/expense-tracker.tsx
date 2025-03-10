"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Trash2, File, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReceiptData {
  id: string
  name: string
  folderId: string
  file: string
  fileType: string
  date: Date
  notes?: string
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  paymentMethod: string
  person: string
  date: Date
  receiptId?: string // ID del comprobante asociado
}

export default function ExpenseTracker() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [people, setPeople] = useState<string[]>([])
  const [livingStatus, setLivingStatus] = useState<"solo" | "acompañado">("solo")
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>("")
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null)

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [person, setPerson] = useState("")
  const [date, setDate] = useState<Date>(new Date())

  // Cargar datos desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedExpenses = localStorage.getItem("expenses")
      const savedCategories = localStorage.getItem("categories")
      const savedPaymentMethods = localStorage.getItem("paymentMethods")
      const savedPeople = localStorage.getItem("people")
      const savedSettings = localStorage.getItem("appSettings")
      const savedReceipts = localStorage.getItem("receipts")

      if (savedExpenses) {
        try {
          setExpenses(
            JSON.parse(savedExpenses).map((exp: any) => ({
              ...exp,
              date: new Date(exp.date),
            })),
          )
        } catch (error) {
          console.error("Error parsing expenses:", error)
          setExpenses([])
        }
      }

      if (savedCategories) {
        try {
          setCategories(JSON.parse(savedCategories))
        } catch (error) {
          console.error("Error parsing categories:", error)
          setCategories([])
        }
      }

      if (savedPaymentMethods) {
        try {
          setPaymentMethods(JSON.parse(savedPaymentMethods))
        } catch (error) {
          console.error("Error parsing payment methods:", error)
          setPaymentMethods([])
        }
      }

      if (savedPeople) {
        try {
          setPeople(JSON.parse(savedPeople))
        } catch (error) {
          console.error("Error parsing people:", error)
          setPeople([])
        }
      }

      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings)
          if (settings.livingStatus) {
            setLivingStatus(settings.livingStatus)
          }
        } catch (error) {
          console.error("Error parsing settings:", error)
        }
      }

      if (savedReceipts) {
        try {
          const parsedReceipts = JSON.parse(savedReceipts).map((receipt: any) => ({
            ...receipt,
            date: new Date(receipt.date),
          }))
          setReceipts(parsedReceipts)
        } catch (error) {
          console.error("Error parsing receipts:", error)
          setReceipts([])
        }
      }
    }
  }, [])

  // Escuchar cambios en la configuración
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleStorageChange = () => {
        const savedSettings = localStorage.getItem("appSettings")

        if (savedSettings) {
          try {
            const settings = JSON.parse(savedSettings)
            if (settings.livingStatus) {
              setLivingStatus(settings.livingStatus)
            }
          } catch (error) {
            console.error("Error parsing settings from storage event:", error)
          }
        }
      }

      window.addEventListener("storage", handleStorageChange)

      // También verificamos periódicamente por cambios en localStorage
      const interval = setInterval(() => {
        const savedSettings = localStorage.getItem("appSettings")

        if (savedSettings) {
          try {
            const settings = JSON.parse(savedSettings)
            if (settings.livingStatus !== livingStatus) {
              setLivingStatus(settings.livingStatus)
              // Si cambia de acompañado a solo, limpiamos el campo de persona
              if (settings.livingStatus === "solo") {
                setPerson("")
              }
            }
          } catch (error) {
            console.error("Error parsing settings from interval:", error)
          }
        }
      }, 1000)

      return () => {
        window.removeEventListener("storage", handleStorageChange)
        clearInterval(interval)
      }
    }
  }, [livingStatus])

  // Guardar gastos en localStorage cuando cambian
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("expenses", JSON.stringify(expenses))
    }
  }, [expenses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const requiredFields = [description, amount, category, paymentMethod]
    if (livingStatus === "acompañado") {
      requiredFields.push(person)
    }

    if (requiredFields.some((field) => !field)) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description,
      amount: Number.parseFloat(amount),
      category,
      paymentMethod,
      person: livingStatus === "acompañado" ? person : "Yo",
      date,
    }

    setExpenses([...expenses, newExpense])

    // Limpiar formulario
    setDescription("")
    setAmount("")
    setCategory("")
    setPaymentMethod("")
    setPerson("")
    setDate(new Date())

    toast({
      title: "Gasto agregado",
      description: "El gasto ha sido registrado correctamente",
    })
  }

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
    toast({
      title: "Gasto eliminado",
      description: "El gasto ha sido eliminado correctamente",
    })
  }

  // Función para asociar un comprobante a un gasto
  const handleLinkReceipt = (expenseId: string) => {
    setCurrentExpenseId(expenseId)
    setShowReceiptDialog(true)

    // Si el gasto ya tiene un comprobante asociado, seleccionarlo
    const expense = expenses.find((exp) => exp.id === expenseId)
    if (expense?.receiptId) {
      setSelectedReceiptId(expense.receiptId)
    } else {
      setSelectedReceiptId("none")
    }
  }

  // Función para guardar la asociación del comprobante
  const handleSaveReceiptLink = () => {
    if (!currentExpenseId) return

    const updatedExpenses = expenses.map((expense) => {
      if (expense.id === currentExpenseId) {
        return {
          ...expense,
          receiptId: selectedReceiptId === "none" ? undefined : selectedReceiptId,
        }
      }
      return expense
    })

    setExpenses(updatedExpenses)
    setShowReceiptDialog(false)
    setCurrentExpenseId(null)

    toast({
      title: selectedReceiptId !== "none" ? "Comprobante asociado" : "Asociación eliminada",
      description:
        selectedReceiptId !== "none"
          ? "El comprobante ha sido asociado al gasto correctamente"
          : "La asociación con el comprobante ha sido eliminada",
    })
  }

  // Función para obtener el nombre del comprobante
  const getReceiptName = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId)
    return receipt ? receipt.name : "Comprobante no encontrado"
  }

  // Función para ver el comprobante asociado
  const handleViewLinkedReceipt = (receiptId: string) => {
    const receipt = receipts.find((r) => r.id === receiptId)
    if (!receipt) {
      toast({
        title: "Error",
        description: "No se encontró el comprobante asociado",
        variant: "destructive",
      })
      return
    }

    // Crear un enlace temporal para abrir el comprobante en una nueva pestaña
    const link = document.createElement("a")
    link.href = receipt.file
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nuevo Gasto</CardTitle>
          <CardDescription>Registra un nuevo gasto en tu seguimiento financiero</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Compra de supermercado"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-categories" disabled>
                        No hay categorías disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="payment-method">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Selecciona un método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.length > 0 ? (
                      paymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-methods" disabled>
                        No hay métodos de pago disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {livingStatus === "acompañado" && (
                <div className="grid gap-2">
                  <Label htmlFor="person">Persona</Label>
                  <Select value={person} onValueChange={setPerson}>
                    <SelectTrigger id="person">
                      <SelectValue placeholder="¿Quién realizó el gasto?" />
                    </SelectTrigger>
                    <SelectContent>
                      {people.length > 0 ? (
                        people.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-people" disabled>
                          No hay personas disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Agregar Gasto
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Gastos</CardTitle>
          <CardDescription>
            Total gastado: <span className="font-bold">${totalAmount.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    {livingStatus === "acompañado" && <TableHead>Persona</TableHead>}
                    <TableHead>Fecha</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>${expense.amount.toFixed(2)}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.paymentMethod}</TableCell>
                      {livingStatus === "acompañado" && <TableCell>{expense.person}</TableCell>}
                      <TableCell>{format(expense.date, "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        {expense.receiptId ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleViewLinkedReceipt(expense.receiptId!)}
                            >
                              <File className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-[100px]">{getReceiptName(expense.receiptId)}</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Sin comprobante</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleLinkReceipt(expense.id)}
                            title="Asociar comprobante"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteExpense(expense.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay gastos registrados</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asociar Comprobante</DialogTitle>
            <DialogDescription>Selecciona un comprobante para asociar a este gasto</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedReceiptId} onValueChange={setSelectedReceiptId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un comprobante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {receipts.map((receipt) => (
                  <SelectItem key={receipt.id} value={receipt.id}>
                    {receipt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveReceiptLink}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

