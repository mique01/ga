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

export default function CategoryManager() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [expenses, setExpenses] = useState<any[]>([])
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  // Cargar datos desde localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem("categories")
    const savedExpenses = localStorage.getItem("expenses")

    if (savedCategories) setCategories(JSON.parse(savedCategories))
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses))
  }, [])

  // Guardar categorías en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories))
  }, [categories])

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCategory.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la categoría",
        variant: "destructive",
      })
      return
    }

    if (categories.includes(newCategory.trim())) {
      toast({
        title: "Error",
        description: "Esta categoría ya existe",
        variant: "destructive",
      })
      return
    }

    setCategories([...categories, newCategory.trim()])
    setNewCategory("")

    toast({
      title: "Categoría agregada",
      description: "La categoría ha sido agregada correctamente",
    })
  }

  const confirmDeleteCategory = (category: string) => {
    setCategoryToDelete(category)
  }

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return

    // Verificar si hay gastos con esta categoría
    const hasExpenses = expenses.some((expense) => expense.category === categoryToDelete)

    if (hasExpenses) {
      // Actualizar los gastos que usan esta categoría
      const updatedExpenses = expenses.map((expense) => {
        if (expense.category === categoryToDelete) {
          return { ...expense, category: "Sin categoría" }
        }
        return expense
      })

      setExpenses(updatedExpenses)
      localStorage.setItem("expenses", JSON.stringify(updatedExpenses))
    }

    // Eliminar la categoría
    setCategories(categories.filter((cat) => cat !== categoryToDelete))

    toast({
      title: "Categoría eliminada",
      description: "La categoría ha sido eliminada correctamente",
    })

    setCategoryToDelete(null)
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Categorías</CardTitle>
          <CardDescription>Agrega, edita o elimina categorías para tus gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="new-category">Nueva Categoría</Label>
              <Input
                id="new-category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Ej: Alimentación, Transporte, Entretenimiento"
              />
            </div>
            <Button type="submit" className="mt-8">
              Agregar
            </Button>
          </form>

          {categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre de la Categoría</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => confirmDeleteCategory(category)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Los gastos que usan esta categoría se marcarán como "Sin
                              categoría".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCategory}>Eliminar</AlertDialogAction>
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
              No hay categorías disponibles. Agrega una nueva categoría para comenzar.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

