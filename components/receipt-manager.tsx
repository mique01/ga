"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Folder,
  FolderPlus,
  File,
  Trash2,
  Upload,
  Download,
  MoreVertical,
  Eye,
  Edit,
  Save,
  X,
  ChevronRight,
  Archive,
} from "lucide-react"
import JSZip from "jszip"
// Corregimos la importación de file-saver
import FileSaver from "file-saver"

interface Receipt {
  id: string
  name: string
  folderId: string
  file: string // Base64 encoded file
  fileType: string
  date: Date
  notes?: string
}

interface ReceiptFolder {
  id: string
  name: string
}

export default function ReceiptManager() {
  const { toast } = useToast()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [folders, setFolders] = useState<ReceiptFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState("")
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null)
  const [viewingReceipt, setViewingReceipt] = useState<Receipt | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar datos desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedReceipts = localStorage.getItem("receipts")
      const savedFolders = localStorage.getItem("receiptFolders")

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

      if (savedFolders) {
        try {
          setFolders(JSON.parse(savedFolders))
        } catch (error) {
          console.error("Error parsing folders:", error)
          const defaultFolder = { id: "default", name: "General" }
          setFolders([defaultFolder])
          localStorage.setItem("receiptFolders", JSON.stringify([defaultFolder]))
        }
      } else {
        // Crear carpeta por defecto si no hay carpetas
        const defaultFolder = { id: "default", name: "General" }
        setFolders([defaultFolder])
        localStorage.setItem("receiptFolders", JSON.stringify([defaultFolder]))
      }

      // Seleccionar la carpeta por defecto si no hay ninguna seleccionada
      setSelectedFolder("default")
    }
  }, [])

  // Guardar datos en localStorage cuando cambian
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("receipts", JSON.stringify(receipts))
    }
  }, [receipts])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("receiptFolders", JSON.stringify(folders))
    }
  }, [folders])

  const handleAddFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la carpeta",
        variant: "destructive",
      })
      return
    }

    if (folders.some((folder) => folder.name === newFolderName.trim())) {
      toast({
        title: "Error",
        description: "Ya existe una carpeta con ese nombre",
        variant: "destructive",
      })
      return
    }

    const newFolder: ReceiptFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
    }

    setFolders([...folders, newFolder])
    setNewFolderName("")
    setSelectedFolder(newFolder.id)

    toast({
      title: "Carpeta creada",
      description: `La carpeta "${newFolder.name}" ha sido creada correctamente`,
    })
  }

  const handleEditFolder = () => {
    if (!editingFolder) return

    if (!editFolderName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la carpeta",
        variant: "destructive",
      })
      return
    }

    if (folders.some((folder) => folder.name === editFolderName.trim() && folder.id !== editingFolder)) {
      toast({
        title: "Error",
        description: "Ya existe una carpeta con ese nombre",
        variant: "destructive",
      })
      return
    }

    const updatedFolders = folders.map((folder) =>
      folder.id === editingFolder ? { ...folder, name: editFolderName.trim() } : folder,
    )

    setFolders(updatedFolders)
    setEditingFolder(null)
    setEditFolderName("")

    toast({
      title: "Carpeta actualizada",
      description: "El nombre de la carpeta ha sido actualizado correctamente",
    })
  }

  const confirmDeleteFolder = (folderId: string) => {
    setFolderToDelete(folderId)
  }

  const handleDeleteFolder = () => {
    if (!folderToDelete) return

    // Verificar si hay comprobantes en esta carpeta
    const hasReceipts = receipts.some((receipt) => receipt.folderId === folderToDelete)

    if (hasReceipts) {
      // Mover los comprobantes a la carpeta por defecto o eliminarlos
      const updatedReceipts = receipts.map((receipt) =>
        receipt.folderId === folderToDelete ? { ...receipt, folderId: "default" } : receipt,
      )

      setReceipts(updatedReceipts)
    }

    // Eliminar la carpeta
    setFolders(folders.filter((folder) => folder.id !== folderToDelete))

    // Si la carpeta eliminada era la seleccionada, seleccionar la carpeta por defecto
    if (selectedFolder === folderToDelete) {
      setSelectedFolder("default")
    }

    toast({
      title: "Carpeta eliminada",
      description: "La carpeta ha sido eliminada correctamente",
    })

    setFolderToDelete(null)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedFolder) return

    // Verificar tamaño del archivo (máximo 5MB para localStorage)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. El tamaño máximo es 5MB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64String = e.target?.result as string

      const newReceipt: Receipt = {
        id: Date.now().toString(),
        name: file.name,
        folderId: selectedFolder,
        file: base64String,
        fileType: file.type,
        date: new Date(),
      }

      setReceipts([...receipts, newReceipt])

      toast({
        title: "Comprobante subido",
        description: "El comprobante ha sido subido correctamente",
      })

      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    reader.readAsDataURL(file)
  }

  const confirmDeleteReceipt = (receiptId: string) => {
    setReceiptToDelete(receiptId)
  }

  const handleDeleteReceipt = () => {
    if (!receiptToDelete) return

    setReceipts(receipts.filter((receipt) => receipt.id !== receiptToDelete))

    toast({
      title: "Comprobante eliminado",
      description: "El comprobante ha sido eliminado correctamente",
    })

    setReceiptToDelete(null)
  }

  const handleViewReceipt = (receipt: Receipt) => {
    setViewingReceipt(receipt)
  }

  const handleDownloadReceipt = (receipt: Receipt) => {
    // Crear un enlace temporal para descargar el archivo
    const link = document.createElement("a")
    link.href = receipt.file
    link.download = receipt.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Descargando comprobante",
      description: `Descargando "${receipt.name}"`,
    })
  }

  // Nueva función para descargar todos los comprobantes de una carpeta como ZIP
  const handleDownloadFolder = async () => {
    if (!selectedFolder) return

    const folderReceipts = receipts.filter((receipt) => receipt.folderId === selectedFolder)

    if (folderReceipts.length === 0) {
      toast({
        title: "Carpeta vacía",
        description: "No hay comprobantes para descargar en esta carpeta",
        variant: "destructive",
      })
      return
    }

    setIsDownloading(true)

    try {
      const zip = new JSZip()
      const folder = zip.folder(getFolderName(selectedFolder))

      if (!folder) {
        throw new Error("No se pudo crear la carpeta ZIP")
      }

      // Añadir cada comprobante al ZIP
      folderReceipts.forEach((receipt) => {
        // Extraer el contenido base64 (eliminar el prefijo data:image/png;base64, etc.)
        const base64Data = receipt.file.split(",")[1]

        // Determinar la extensión del archivo basada en el tipo MIME
        let extension = ".file"
        if (receipt.fileType.includes("image/jpeg")) extension = ".jpg"
        else if (receipt.fileType.includes("image/png")) extension = ".png"
        else if (receipt.fileType.includes("application/pdf")) extension = ".pdf"

        // Añadir el archivo al ZIP
        folder.file(receipt.name, base64Data, { base64: true })
      })

      // Generar el archivo ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" })

      // Descargar el archivo ZIP usando FileSaver.saveAs en lugar de saveAs directamente
      FileSaver.saveAs(zipBlob, `${getFolderName(selectedFolder)}.zip`)

      toast({
        title: "Carpeta descargada",
        description: `Se han descargado ${folderReceipts.length} comprobantes como ZIP`,
      })
    } catch (error) {
      console.error("Error al crear el archivo ZIP:", error)
      toast({
        title: "Error",
        description: "No se pudo descargar la carpeta. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const getFolderName = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    return folder ? folder.name : "Desconocido"
  }

  const filteredReceipts = selectedFolder ? receipts.filter((receipt) => receipt.folderId === selectedFolder) : receipts

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Carpetas</CardTitle>
            <CardDescription>Organiza tus comprobantes en carpetas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Input
                placeholder="Nueva carpeta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={handleAddFolder} title="Crear carpeta">
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div
                    className={`flex items-center gap-2 flex-1 ${selectedFolder === folder.id ? "font-medium" : ""}`}
                  >
                    <Folder className="h-4 w-4" />
                    {editingFolder === folder.id ? (
                      <Input
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="h-7 py-1"
                      />
                    ) : (
                      <span>{folder.name}</span>
                    )}
                  </div>

                  {editingFolder === folder.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditFolder()
                        }}
                        className="h-7 w-7"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingFolder(null)
                        }}
                        className="h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {folder.id !== "default" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingFolder(folder.id)
                              setEditFolderName(folder.name)
                            }}
                            className="h-7 w-7"
                            title="Editar carpeta"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  confirmDeleteFolder(folder.id)
                                }}
                                className="h-7 w-7"
                                title="Eliminar carpeta"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Los comprobantes de esta carpeta se moverán a la
                                  carpeta "General".
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteFolder}>Eliminar</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      {selectedFolder === folder.id && <ChevronRight className="h-4 w-4 ml-1" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3">
        <Card className="h-full">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{selectedFolder ? getFolderName(selectedFolder) : "Todos los comprobantes"}</CardTitle>
                <CardDescription>
                  {selectedFolder
                    ? `Comprobantes en la carpeta "${getFolderName(selectedFolder)}"`
                    : "Todos los comprobantes almacenados"}
                </CardDescription>
              </div>

              {selectedFolder && (
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*, application/pdf"
                  />
                  <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Subir comprobante
                  </Button>

                  {/* Botón para descargar toda la carpeta como ZIP */}
                  <Button
                    variant="outline"
                    onClick={handleDownloadFolder}
                    className="flex items-center gap-2"
                    disabled={isDownloading || filteredReceipts.length === 0}
                  >
                    <Archive className="h-4 w-4" />
                    {isDownloading ? "Descargando..." : "Descargar carpeta"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredReceipts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      {!selectedFolder && <TableHead>Carpeta</TableHead>}
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{receipt.name}</span>
                        </TableCell>
                        <TableCell>
                          {receipt.fileType.includes("image")
                            ? "Imagen"
                            : receipt.fileType.includes("pdf")
                              ? "PDF"
                              : "Archivo"}
                        </TableCell>
                        <TableCell>{format(receipt.date, "dd/MM/yyyy")}</TableCell>
                        {!selectedFolder && <TableCell>{getFolderName(receipt.folderId)}</TableCell>}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewReceipt(receipt)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadReceipt(receipt)}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => confirmDeleteReceipt(receipt.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <File className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay comprobantes</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedFolder
                    ? "No hay comprobantes en esta carpeta. Sube uno para comenzar."
                    : "No hay comprobantes almacenados."}
                </p>
                {selectedFolder && (
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Upload className="h-4 w-4" />
                    Subir comprobante
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo para ver comprobantes */}
      <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingReceipt?.name}</DialogTitle>
            <DialogDescription>
              Subido el {viewingReceipt && format(viewingReceipt.date, "PPP", { locale: es })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center p-4 bg-muted/30 rounded-md overflow-auto max-h-[70vh]">
            {viewingReceipt?.fileType.includes("image") ? (
              <img
                src={viewingReceipt.file || "/placeholder.svg"}
                alt={viewingReceipt.name}
                className="max-w-full h-auto object-contain"
              />
            ) : viewingReceipt?.fileType.includes("pdf") ? (
              <iframe src={viewingReceipt.file} title={viewingReceipt.name} className="w-full h-[60vh]" />
            ) : (
              <div className="text-center py-8">
                <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p>Este tipo de archivo no se puede previsualizar</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => viewingReceipt && handleDownloadReceipt(viewingReceipt)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar comprobante */}
      <AlertDialog open={!!receiptToDelete} onOpenChange={(open) => !open && setReceiptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar comprobante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El comprobante será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReceipt}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

