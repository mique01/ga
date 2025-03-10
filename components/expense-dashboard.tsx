"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  format,
  isWithinInterval,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInDays,
  addDays,
  isSameMonth,
  isSameDay,
  startOfDay,
  endOfDay,
} from "date-fns"
import { es } from "date-fns/locale"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { CalendarIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  paymentMethod: string
  person: string
  date: Date
}

interface DateRange {
  from: Date
  to: Date
}

interface PeriodSummary {
  date: Date
  total: number
}

export default function ExpenseDashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [date, setDate] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [compareMode, setCompareMode] = useState(false)
  const [dailySummaries, setDailySummaries] = useState<PeriodSummary[]>([])
  const [compareSummaries, setCompareSummaries] = useState<PeriodSummary[]>([])
  const [categoryTotals, setCategoryTotals] = useState<{ [key: string]: number }>({})
  const [compareCategoryTotals, setCompareCategoryTotals] = useState<{ [key: string]: number }>({})
  const [personTotals, setPersonTotals] = useState<{ [key: string]: number }>({})
  const [comparePersonTotals, setComparePersonTotals] = useState<{ [key: string]: number }>({})
  // Agregar este estado al inicio del componente
  const [livingStatus, setLivingStatus] = useState<"solo" | "acompañado">("solo")

  // Cargar datos desde localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem("expenses")

    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses).map((exp: any) => ({
        ...exp,
        date: new Date(exp.date),
      }))
      setExpenses(parsedExpenses)
    }

    // Agregar esto al useEffect de carga inicial
    const savedSettings = localStorage.getItem("appSettings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      if (settings.livingStatus) {
        setLivingStatus(settings.livingStatus)
      }
    }
  }, [])

  // Agregar este useEffect para escuchar cambios en la configuración
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem("appSettings")

      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        if (settings.livingStatus) {
          setLivingStatus(settings.livingStatus)
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // También verificamos periódicamente por cambios en localStorage
    const interval = setInterval(() => {
      const savedSettings = localStorage.getItem("appSettings")

      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        if (settings.livingStatus !== livingStatus) {
          setLivingStatus(settings.livingStatus)
        }
      }
    }, 1000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(interval)
    }
  }, [livingStatus])

  // Calcular resúmenes cuando cambian los gastos o el período
  useEffect(() => {
    if (expenses.length === 0) return

    calculateSummaries()
  }, [expenses, date, compareMode])

  const calculateSummaries = () => {
    // Calcular el período actual
    const currentPeriodExpenses = expenses.filter((expense) =>
      isWithinInterval(expense.date, {
        start: startOfDay(date.from),
        end: endOfDay(date.to),
      }),
    )

    // Calcular totales por día para el período actual
    const days = eachDayOfInterval({ start: date.from, end: date.to })
    const dailyTotals = days.map((day) => {
      const dayExpenses = currentPeriodExpenses.filter((expense) => isSameDay(expense.date, day))
      const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      return {
        date: day,
        total,
      }
    })

    setDailySummaries(dailyTotals)

    // Calcular totales por categoría para el período actual
    const catTotals: { [key: string]: number } = {}
    currentPeriodExpenses.forEach((expense) => {
      if (!catTotals[expense.category]) {
        catTotals[expense.category] = 0
      }
      catTotals[expense.category] += expense.amount
    })
    setCategoryTotals(catTotals)

    // Calcular totales por persona para el período actual
    const perTotals: { [key: string]: number } = {}
    currentPeriodExpenses.forEach((expense) => {
      if (!perTotals[expense.person]) {
        perTotals[expense.person] = 0
      }
      perTotals[expense.person] += expense.amount
    })
    setPersonTotals(perTotals)

    // Si está activado el modo de comparación, calcular el período anterior
    if (compareMode) {
      const daysDiff = differenceInDays(date.to, date.from) + 1
      const comparePeriodEnd = addDays(date.from, -1)
      const comparePeriodStart = addDays(comparePeriodEnd, -daysDiff + 1)

      const comparePeriodExpenses = expenses.filter((expense) =>
        isWithinInterval(expense.date, {
          start: startOfDay(comparePeriodStart),
          end: endOfDay(comparePeriodEnd),
        }),
      )

      // Calcular totales por día para el período de comparación
      const compareDays = eachDayOfInterval({ start: comparePeriodStart, end: comparePeriodEnd })
      const compareDailyTotals = compareDays.map((day) => {
        const dayExpenses = comparePeriodExpenses.filter((expense) => isSameDay(expense.date, day))
        const total = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        return {
          date: day,
          total,
        }
      })

      setCompareSummaries(compareDailyTotals)

      // Calcular totales por categoría para el período de comparación
      const compareCatTotals: { [key: string]: number } = {}
      comparePeriodExpenses.forEach((expense) => {
        if (!compareCatTotals[expense.category]) {
          compareCatTotals[expense.category] = 0
        }
        compareCatTotals[expense.category] += expense.amount
      })
      setCompareCategoryTotals(compareCatTotals)

      // Calcular totales por persona para el período de comparación
      const comparePerTotals: { [key: string]: number } = {}
      comparePeriodExpenses.forEach((expense) => {
        if (!comparePerTotals[expense.person]) {
          comparePerTotals[expense.person] = 0
        }
        comparePerTotals[expense.person] += expense.amount
      })
      setComparePersonTotals(comparePerTotals)
    }
  }

  const handleSelectMonth = (month: Date) => {
    setDate({
      from: startOfMonth(month),
      to: endOfMonth(month),
    })
  }

  const handlePreviousMonth = () => {
    setDate({
      from: startOfMonth(subMonths(date.from, 1)),
      to: endOfMonth(subMonths(date.from, 1)),
    })
  }

  const handleCurrentMonth = () => {
    setDate({
      from: startOfMonth(new Date()),
      to: new Date(),
    })
  }

  const formatDateRange = () => {
    if (isSameMonth(date.from, date.to)) {
      return format(date.from, "MMMM yyyy", { locale: es })
    }
    return `${format(date.from, "d MMM", { locale: es })} - ${format(date.to, "d MMM yyyy", { locale: es })}`
  }

  const currentTotal = dailySummaries.reduce((sum, day) => sum + day.total, 0)
  const compareTotal = compareSummaries.reduce((sum, day) => sum + day.total, 0)
  const totalDifference = currentTotal - compareTotal
  const percentDifference = compareTotal === 0 ? 0 : (totalDifference / compareTotal) * 100

  // Preparar datos para los gráficos
  const chartData = dailySummaries.map((day, index) => {
    const compareDay = compareMode && compareSummaries[index] ? compareSummaries[index].total : 0

    return {
      name: format(day.date, "dd/MM"),
      actual: day.total,
      anterior: compareMode ? compareDay : undefined,
    }
  })

  const categoryChartData = Object.entries(categoryTotals)
    .map(([category, total]) => {
      const compareTotal = compareMode && compareCategoryTotals[category] ? compareCategoryTotals[category] : 0

      return {
        name: category,
        actual: total,
        anterior: compareMode ? compareTotal : undefined,
      }
    })
    .sort((a, b) => b.actual - a.actual)
    .slice(0, 5) // Top 5 categorías

  const personChartData = Object.entries(personTotals)
    .map(([person, total]) => {
      const compareTotal = compareMode && comparePersonTotals[person] ? comparePersonTotals[person] : 0

      return {
        name: person,
        actual: total,
        anterior: compareMode ? compareTotal : undefined,
      }
    })
    .sort((a, b) => b.actual - a.actual)

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Resumen de Gastos</CardTitle>
              <CardDescription>Visualiza tus gastos por período de tiempo</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="compare-mode" checked={compareMode} onCheckedChange={setCompareMode} />
                <Label htmlFor="compare-mode">Comparar con período anterior</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  Mes Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={handleCurrentMonth}>
                  Mes Actual
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateRange()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={(range) => range && setDate(range)}
                    initialFocus
                    numberOfMonths={2}
                    footer={
                      <div className="flex justify-center gap-2 pt-2">
                        {Array.from({ length: 3 }).map((_, i) => {
                          const month = subMonths(new Date(), i)
                          return (
                            <Button key={i} variant="outline" size="sm" onClick={() => handleSelectMonth(month)}>
                              {format(month, "MMM", { locale: es })}
                            </Button>
                          )
                        })}
                      </div>
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col items-end">
              <div className="text-2xl font-bold">${currentTotal.toFixed(2)}</div>
              {compareMode && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-sm",
                      totalDifference > 0 ? "text-red-500" : totalDifference < 0 ? "text-green-500" : "",
                    )}
                  >
                    {totalDifference > 0 ? (
                      <ArrowUpIcon className="inline h-3 w-3" />
                    ) : totalDifference < 0 ? (
                      <ArrowDownIcon className="inline h-3 w-3" />
                    ) : null}
                    {totalDifference !== 0
                      ? `${Math.abs(totalDifference).toFixed(2)} (${Math.abs(percentDifference).toFixed(1)}%)`
                      : "Sin cambios"}
                  </span>
                  <span className="text-sm text-muted-foreground">vs. ${compareTotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {dailySummaries.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Gastos Diarios</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 60,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
                      <Legend />
                      <Bar dataKey="actual" name="Período Actual" fill="#8884d8" />
                      {compareMode && <Bar dataKey="anterior" name="Período Anterior" fill="#82ca9d" />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Total Actual</TableHead>
                      {compareMode && (
                        <>
                          <TableHead className="text-right">Total Anterior</TableHead>
                          <TableHead className="text-right">Diferencia</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySummaries.map((day, index) => {
                      const compareDay = compareMode && compareSummaries[index] ? compareSummaries[index].total : 0
                      const diff = day.total - compareDay

                      return (
                        <TableRow key={day.date.toString()}>
                          <TableCell>{format(day.date, "dd/MM/yyyy")}</TableCell>
                          <TableCell className="text-right font-medium">${day.total.toFixed(2)}</TableCell>
                          {compareMode && (
                            <>
                              <TableCell className="text-right">${compareDay.toFixed(2)}</TableCell>
                              <TableCell
                                className={cn(
                                  "text-right",
                                  diff > 0 ? "text-red-500" : diff < 0 ? "text-green-500" : "",
                                )}
                              >
                                {diff !== 0 ? (
                                  <>
                                    {diff > 0 ? "+" : ""}${diff.toFixed(2)}
                                  </>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      )
                    })}
                    <TableRow className="font-bold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-right">${currentTotal.toFixed(2)}</TableCell>
                      {compareMode && (
                        <>
                          <TableCell className="text-right">${compareTotal.toFixed(2)}</TableCell>
                          <TableCell
                            className={cn(
                              "text-right",
                              totalDifference > 0 ? "text-red-500" : totalDifference < 0 ? "text-green-500" : "",
                            )}
                          >
                            {totalDifference !== 0 ? (
                              <>
                                {totalDifference > 0 ? "+" : ""}${totalDifference.toFixed(2)}
                              </>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay datos disponibles para mostrar en el período seleccionado
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
            <CardDescription>Top 5 categorías con más gastos</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 40,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
                    <Legend />
                    <Bar dataKey="actual" name="Período Actual" fill="#82ca9d" />
                    {compareMode && <Bar dataKey="anterior" name="Período Anterior" fill="#ffc658" />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay datos disponibles para mostrar</p>
            )}
          </CardContent>
        </Card>

        {livingStatus === "acompañado" && (
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Persona</CardTitle>
              <CardDescription>Total gastado por cada persona</CardDescription>
            </CardHeader>
            <CardContent>
              {personChartData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={personChartData}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: 30,
                        left: 40,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => [`$${value}`, "Total"]} />
                      <Legend />
                      <Bar dataKey="actual" name="Período Actual" fill="#ffc658" />
                      {compareMode && <Bar dataKey="anterior" name="Período Anterior" fill="#8884d8" />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No hay datos disponibles para mostrar</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

