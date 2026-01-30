import Layout from "@/react-app/components/Layout";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Package, Edit, Ship, FileText, Upload, Trash2, Download, Image as ImageIcon, FileIcon, Plus, X, DollarSign } from "lucide-react";
import { useUserRole } from "@/react-app/hooks/useUserRole";
import { useTiposProductos } from "@/react-app/hooks/useTiposProductos";
import { useCalendario } from "@/react-app/hooks/useCalendario";
import { useEmbarqueServicios } from "@/react-app/hooks/useEmbarqueServicios";
import { useServicios } from "@/react-app/hooks/useServicios";
import { useTiposDocumento } from "@/react-app/hooks/useTiposDocumento";
import { jsPDF } from "jspdf";

interface EmbarqueDetail {
  id: number;
  codigo_embarque: string;
  estado_actual: string;
  notas: string;
  created_at: string;
  updated_at: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono: string;
  direccion_destino: string;
  productos: any[];
  documentos: any[];
}

type Tab = "productos" | "documentos" | "servicios";

export default function EmbarqueDetail() {
  const { id } = useParams();
  const { isCliente, isOperador, isAdministrador } = useUserRole();
  const { tiposProductos } = useTiposProductos();
  const { getCalendarioByProductType } = useCalendario();
  const { servicios: embarqueServicios, loading: loadingServicios, refetch: refetchServicios } = useEmbarqueServicios(id);
  const { servicios: serviciosDisponibles } = useServicios();
  const { tiposDocumento } = useTiposDocumento();
  
  const [embarque, setEmbarque] = useState<EmbarqueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("productos");
  const [editingEstado, setEditingEstado] = useState(false);
  const [editingNotas, setEditingNotas] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [nuevasNotas, setNuevasNotas] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState("");
  const [hoveredDoc, setHoveredDoc] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  
  // Product management
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    descripcion: "",
    peso: "",
    volumen: "",
    tipo_contenido: "",
    comercializadora: "",
    id_calendario_embarque: "",
  });

  // Services management
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServicio, setEditingServicio] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    id_servicio: "",
    cantidad: "1",
    costo_unitario: "",
    notas: "",
  });

  const estados = [
    "Solicitado",
    "Retirado",
    "En Bodega",
    "Embarcado",
    "En Tránsito",
    "Entregado",
  ];

  const canEditServices = isOperador || isAdministrador;

  useEffect(() => {
    fetchEmbarque();
  }, [id]);

  const fetchEmbarque = async () => {
    try {
      const response = await fetch(`/api/embarques/${id}`);
      const data = await response.json();
      setEmbarque(data);
      setNuevoEstado(data.estado_actual);
      setNuevasNotas(data.notas || "");
    } catch (error) {
      console.error("Error fetching embarque:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async () => {
    try {
      const response = await fetch(`/api/embarques/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado_actual: nuevoEstado }),
      });

      if (response.ok) {
        setEditingEstado(false);
        fetchEmbarque();
      }
    } catch (error) {
      console.error("Error updating estado:", error);
    }
  };

  const handleUpdateNotas = async () => {
    try {
      const response = await fetch(`/api/embarques/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notas: nuevasNotas }),
      });

      if (response.ok) {
        setEditingNotas(false);
        fetchEmbarque();
      }
    } catch (error) {
      console.error("Error updating notas:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !id) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("embarque_id", id);

      const uploadResponse = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir archivo");
      }

      const uploadData = await uploadResponse.json();

      const docResponse = await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_embarque: parseInt(id),
          tipo_documento: tipoDocumento,
          archivo_url: uploadData.key,
          nombre_archivo: uploadData.filename,
        }),
      });

      if (docResponse.ok) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setTipoDocumento("");
        fetchEmbarque();
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Error al subir el documento");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (documentId: number, archivoUrl?: string) => {
    if (!archivoUrl || !confirm("¿Estás seguro de eliminar este documento?")) return;

    try {
      await fetch(`/api/documentos/${documentId}`, {
        method: "DELETE",
      });

      await fetch(`/api/files/${encodeURIComponent(archivoUrl)}`, {
        method: "DELETE",
      });

      fetchEmbarque();
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleDownloadDocument = async (archivoUrl?: string, nombreArchivo?: string) => {
    if (!archivoUrl || !nombreArchivo) return;
    try {
      const response = await fetch(`/api/files/${archivoUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const openProductModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        descripcion: product.descripcion,
        peso: product.peso?.toString() || "",
        volumen: product.volumen?.toString() || "",
        tipo_contenido: product.tipo_contenido || "",
        comercializadora: product.comercializadora || "",
        id_calendario_embarque: product.id_calendario_embarque?.toString() || "",
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        descripcion: "",
        peso: "",
        volumen: "",
        tipo_contenido: "",
        comercializadora: "",
        id_calendario_embarque: "",
      });
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        const response = await fetch(`/api/productos/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descripcion: productForm.descripcion,
            peso: productForm.peso ? parseFloat(productForm.peso) : null,
            volumen: productForm.volumen ? parseFloat(productForm.volumen) : null,
            tipo_contenido: productForm.tipo_contenido,
            comercializadora: productForm.comercializadora,
            id_calendario_embarque: productForm.id_calendario_embarque ? parseInt(productForm.id_calendario_embarque) : null,
          }),
        });

        if (response.ok) {
          setShowProductModal(false);
          fetchEmbarque();
        } else {
          const errorData = await response.json();
          alert(errorData.error || "Error al actualizar el producto");
        }
      } else {
        const response = await fetch("/api/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_embarque: parseInt(id!),
            descripcion: productForm.descripcion,
            peso: productForm.peso ? parseFloat(productForm.peso) : null,
            volumen: productForm.volumen ? parseFloat(productForm.volumen) : null,
            tipo_contenido: productForm.tipo_contenido,
            comercializadora: productForm.comercializadora,
            estado_producto: embarque?.estado_actual || "Solicitado",
            id_calendario_embarque: productForm.id_calendario_embarque ? parseInt(productForm.id_calendario_embarque) : null,
          }),
        });

        if (response.ok) {
          setShowProductModal(false);
          fetchEmbarque();
        } else {
          const errorData = await response.json();
          alert(errorData.error || "Error al guardar el producto");
        }
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error al guardar el producto");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const response = await fetch(`/api/productos/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchEmbarque();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const openServiceModal = (servicio?: any) => {
    if (servicio) {
      setEditingServicio(servicio);
      setServiceForm({
        id_servicio: servicio.id_servicio?.toString() || "",
        cantidad: servicio.cantidad?.toString() || "1",
        costo_unitario: servicio.costo_unitario?.toString() || "",
        notas: servicio.notas || "",
      });
    } else {
      setEditingServicio(null);
      setServiceForm({
        id_servicio: "",
        cantidad: "1",
        costo_unitario: "",
        notas: "",
      });
    }
    setShowServiceModal(true);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingServicio) {
        const response = await fetch(`/api/embarques-servicios/${editingServicio.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cantidad: parseFloat(serviceForm.cantidad),
            costo_unitario: parseFloat(serviceForm.costo_unitario),
            notas: serviceForm.notas,
          }),
        });

        if (response.ok) {
          setShowServiceModal(false);
          refetchServicios();
        }
      } else {
        const response = await fetch("/api/embarques-servicios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_embarque: parseInt(id!),
            id_servicio: parseInt(serviceForm.id_servicio),
            cantidad: parseFloat(serviceForm.cantidad),
            costo_unitario: parseFloat(serviceForm.costo_unitario),
            notas: serviceForm.notas,
          }),
        });

        if (response.ok) {
          setShowServiceModal(false);
          refetchServicios();
        }
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Error al guardar el servicio");
    }
  };

  const handleDeleteService = async (servicioId: number) => {
    if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

    try {
      const response = await fetch(`/api/embarques-servicios/${servicioId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        refetchServicios();
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleServiceChange = (id_servicio: string) => {
    const servicio = serviciosDisponibles.find(s => s.id.toString() === id_servicio);
    if (servicio) {
      setServiceForm({
        ...serviceForm,
        id_servicio,
        costo_unitario: servicio.costo_base.toString(),
      });
    }
  };

  const generateProforma = () => {
    if (!embarque) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text("Carapachus Logistics", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 10;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("PROFORMA DE SERVICIOS", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`Embarque: ${embarque.codigo_embarque}`, 20, yPos);
    yPos += 6;
    doc.text(`Cliente: ${embarque.nombre_cliente}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${embarque.email_cliente}`, 20, yPos);
    yPos += 6;
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 20, yPos);
    
    yPos += 15;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    // Services table header
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Servicio", 20, yPos);
    doc.text("Cantidad", 100, yPos);
    doc.text("Precio Unit.", 130, yPos);
    doc.text("Total", 170, yPos, { align: "right" });
    
    yPos += 5;
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    // Services items
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    let total = 0;
    embarqueServicios.forEach((servicio) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(servicio.tipo_servicio || "Servicio", 20, yPos);
      doc.text(servicio.cantidad.toString(), 100, yPos);
      doc.text(`$${servicio.costo_unitario.toFixed(2)}`, 130, yPos);
      doc.text(`$${servicio.costo_total.toFixed(2)}`, 170, yPos, { align: "right" });
      
      if (servicio.descripcion_servicio) {
        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(servicio.descripcion_servicio || "", 20, yPos);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
      }
      
      total += servicio.costo_total;
      yPos += 10;
    });
    
    // Total
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL:", 130, yPos);
    doc.text(`$${total.toFixed(2)}`, 170, yPos, { align: "right" });
    
    // Footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Carapachus Logistics - Sistema de Gestión de Entregas a Galápagos", pageWidth / 2, yPos, { align: "center" });
    
    doc.save(`proforma-${embarque.codigo_embarque}.pdf`);
  };

  const loadPreviewUrl = async (docId: number, archivoUrl?: string) => {
    if (previewUrls[docId] || !archivoUrl) return;

    try {
      const response = await fetch(`/api/files/${archivoUrl}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreviewUrls(prev => ({ ...prev, [docId]: url }));
    } catch (error) {
      console.error("Error loading preview:", error);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isImageFile = (filename: string) => {
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
  };

  const isPdfFile = (filename: string) => {
    return getFileExtension(filename) === 'pdf';
  };

  const isPreviewableFile = (filename: string) => {
    return isImageFile(filename) || isPdfFile(filename);
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      Solicitado: "bg-amber-100 text-amber-800",
      Retirado: "bg-blue-100 text-blue-800",
      "En Bodega": "bg-purple-100 text-purple-800",
      Embarcado: "bg-indigo-100 text-indigo-800",
      "En Tránsito": "bg-orange-100 text-orange-800",
      Entregado: "bg-emerald-100 text-emerald-800",
    };
    return colors[estado] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const sortedDocumentos = embarque?.documentos
    ? [...embarque.documentos].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    : [];

  const totalServicios = embarqueServicios.reduce((sum, s) => sum + s.costo_total, 0);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin">
            <Ship className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!embarque) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Embarque no encontrado
          </h2>
          <Link to="/embarques" className="text-emerald-600 hover:text-emerald-700">
            Volver a embarques
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <Link
            to="/embarques"
            className="inline-flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a embarques
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                {embarque.codigo_embarque}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Cliente: {embarque.nombre_cliente}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {editingEstado ? (
                <>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="flex-1 min-w-[150px] px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {estados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateEstado}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 whitespace-nowrap"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingEstado(false);
                      setNuevoEstado(embarque.estado_actual);
                    }}
                    className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium ${getEstadoColor(
                      embarque.estado_actual
                    )}`}
                  >
                    {embarque.estado_actual}
                  </span>
                  {!isCliente && (
                    <button
                      onClick={() => setEditingEstado(true)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 sm:mb-6 border-b border-gray-200">
          <nav className="flex gap-4 sm:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("productos")}
              className={`pb-3 px-1 text-sm sm:text-base font-medium whitespace-nowrap transition-colors ${
                activeTab === "productos"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => setActiveTab("documentos")}
              className={`pb-3 px-1 text-sm sm:text-base font-medium whitespace-nowrap transition-colors ${
                activeTab === "documentos"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab("servicios")}
              className={`pb-3 px-1 text-sm sm:text-base font-medium whitespace-nowrap transition-colors ${
                activeTab === "servicios"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Servicios
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Información del Cliente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Información del Cliente
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Nombre</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900">
                    {embarque.nombre_cliente}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Email</p>
                  <p className="text-sm sm:text-base font-medium text-gray-900 break-all">
                    {embarque.email_cliente}
                  </p>
                </div>
                {embarque.telefono && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Teléfono</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">
                      {embarque.telefono}
                    </p>
                  </div>
                )}
                {embarque.direccion_destino && (
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Dirección de Destino</p>
                    <p className="text-sm sm:text-base font-medium text-gray-900">
                      {embarque.direccion_destino}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Productos Tab */}
            {activeTab === "productos" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Productos
                  </h2>
                  {!isCliente && (
                    <button
                      onClick={() => openProductModal()}
                      className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Agregar Producto</span>
                      <span className="sm:hidden">Agregar</span>
                    </button>
                  )}
                </div>
                {embarque.productos.length === 0 ? (
                  <p className="text-sm sm:text-base text-gray-600 text-center py-6 sm:py-8">
                    No hay productos registrados
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {embarque.productos.map((producto: any) => (
                      <div
                        key={producto.id}
                        className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-gray-900">
                              {producto.descripcion}
                            </p>
                            {producto.tipo_contenido && (
                              <p className="text-xs sm:text-sm text-blue-600 mt-1">
                                {producto.tipo_contenido}
                              </p>
                            )}
                            {producto.comercializadora && (
                              <p className="text-xs text-gray-500 mt-1">
                                Comercializadora: {producto.comercializadora}
                              </p>
                            )}
                            {producto.fecha_embarque && (
                              <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-indigo-700">
                                  <Ship className="w-4 h-4" />
                                  <span className="font-medium">
                                    {new Date(producto.fecha_embarque).toLocaleDateString("es-ES", {
                                      weekday: "short",
                                      day: "numeric",
                                      month: "short"
                                    })}
                                  </span>
                                  {producto.nombre_barco && (
                                    <span>• {producto.nombre_barco}</span>
                                  )}
                                  {producto.puerto_destino && (
                                    <span>→ {producto.puerto_destino}</span>
                                  )}
                                </div>
                                {producto.fecha_arribo_puerto && (
                                  <p className="text-xs text-indigo-600 mt-1">
                                    Arribo estimado: {new Date(producto.fecha_arribo_puerto).toLocaleDateString("es-ES", {
                                      day: "numeric",
                                      month: "short"
                                    })}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="mt-2 grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                              {producto.peso && (
                                <div>
                                  <span className="text-gray-600">Peso: </span>
                                  <span className="text-gray-900">{producto.peso} kg</span>
                                </div>
                              )}
                              {producto.volumen && (
                                <div>
                                  <span className="text-gray-600">Volumen: </span>
                                  <span className="text-gray-900">
                                    {producto.volumen} m³
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {!isCliente && (
                            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                onClick={() => openProductModal(producto)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(producto.id)}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documentos Tab */}
            {activeTab === "documentos" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Documentos
                  </h2>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Subir documento</span>
                    <span className="sm:hidden">Subir</span>
                  </button>
                </div>
                {sortedDocumentos.length === 0 ? (
                  <p className="text-sm sm:text-base text-gray-600 text-center py-6 sm:py-8">
                    No hay documentos adjuntos
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sortedDocumentos.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="relative"
                        onMouseEnter={() => {
                          setHoveredDoc(doc.id);
                          if (isPreviewableFile(doc.nombre_archivo)) {
                            loadPreviewUrl(doc.id, doc.archivo_url);
                          }
                        }}
                        onMouseLeave={() => setHoveredDoc(null)}
                      >
                        <div className="flex items-start sm:items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all gap-3">
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            {isImageFile(doc.nombre_archivo) ? (
                              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                            ) : isPdfFile(doc.nombre_archivo) ? (
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                            ) : (
                              <FileIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                {doc.nombre_archivo}
                              </p>
                              <p className="text-xs text-gray-600">
                                {doc.tipo_documento}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <p className="hidden sm:block text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                              {formatShortDate(doc.created_at)}
                            </p>
                            <button
                              onClick={() => handleDownloadDocument(doc.archivo_url, doc.nombre_archivo)}
                              className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Descargar"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.archivo_url)}
                              className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {hoveredDoc === doc.id && isPreviewableFile(doc.nombre_archivo) && previewUrls[doc.id] && (
                          <div className="hidden lg:block absolute left-full top-0 ml-4 z-50 pointer-events-none">
                            <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-3 w-80">
                              <div className="mb-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {doc.nombre_archivo}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Subido el {formatShortDate(doc.created_at)}
                                </p>
                              </div>
                              {isImageFile(doc.nombre_archivo) ? (
                                <img
                                  src={previewUrls[doc.id]}
                                  alt={doc.nombre_archivo}
                                  className="w-full h-64 object-contain bg-gray-50 rounded-lg"
                                />
                              ) : isPdfFile(doc.nombre_archivo) ? (
                                <div className="w-full h-64 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                                  <FileText className="w-16 h-16 text-red-600 mb-2" />
                                  <p className="text-sm text-gray-600">Documento PDF</p>
                                  <p className="text-xs text-gray-500 mt-1">Haz clic en descargar para ver</p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {hoveredDoc === doc.id && !isPreviewableFile(doc.nombre_archivo) && (
                          <div className="hidden lg:block absolute left-full top-0 ml-4 z-50 pointer-events-none">
                            <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 w-64">
                              <div className="flex flex-col items-center justify-center">
                                <FileIcon className="w-12 h-12 text-gray-400 mb-3" />
                                <p className="text-sm font-medium text-gray-900 text-center mb-1">
                                  {doc.nombre_archivo}
                                </p>
                                <p className="text-xs text-gray-500 text-center mb-3">
                                  No se puede previsualizar este tipo de archivo
                                </p>
                                <div className="flex items-center gap-2 text-xs text-blue-600">
                                  <Download className="w-4 h-4" />
                                  <span>Haz clic para descargar</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Servicios Tab */}
            {activeTab === "servicios" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Servicios Contratados
                  </h2>
                  <div className="flex gap-2">
                    {canEditServices && (
                      <button
                        onClick={() => openServiceModal()}
                        className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Agregar Servicio</span>
                        <span className="sm:hidden">Agregar</span>
                      </button>
                    )}
                    {embarqueServicios.length > 0 && (
                      <button
                        onClick={generateProforma}
                        className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Descargar Proforma</span>
                        <span className="sm:hidden">Proforma</span>
                      </button>
                    )}
                  </div>
                </div>
                {loadingServicios ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin">
                      <DollarSign className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>
                ) : embarqueServicios.length === 0 ? (
                  <p className="text-sm sm:text-base text-gray-600 text-center py-6 sm:py-8">
                    No hay servicios contratados
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {embarqueServicios.map((servicio) => (
                      <div
                        key={servicio.id}
                        className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-medium text-gray-900">
                              {servicio.tipo_servicio}
                            </p>
                            {servicio.descripcion_servicio && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                {servicio.descripcion_servicio}
                              </p>
                            )}
                            {servicio.notas && (
                              <p className="text-xs text-gray-500 mt-1">
                                Nota: {servicio.notas}
                              </p>
                            )}
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <span className="text-gray-600">Cantidad: </span>
                                <span className="text-gray-900">
                                  {servicio.cantidad} {servicio.unidad_medida}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Precio Unit: </span>
                                <span className="text-gray-900">
                                  ${servicio.costo_unitario.toFixed(2)}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-600">Total: </span>
                                <span className="text-emerald-600 font-semibold">
                                  ${servicio.costo_total.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {canEditServices && (
                            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                              <button
                                onClick={() => openServiceModal(servicio)}
                                className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteService(servicio.id)}
                                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                          TOTAL
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                          ${totalServicios.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Detalles
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Creado</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {formatDate(embarque.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Última actualización</p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {formatDate(embarque.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Notas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Notas</h2>
                {!isCliente && !editingNotas && (
                  <button
                    onClick={() => setEditingNotas(true)}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
              </div>
              {editingNotas ? (
                <div className="space-y-3">
                  <textarea
                    value={nuevasNotas}
                    onChange={(e) => setNuevasNotas(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Agregar notas..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateNotas}
                      className="flex-1 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditingNotas(false);
                        setNuevasNotas(embarque.notas || "");
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                  {embarque.notas || "Sin notas"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingProduct ? "Editar Producto" : "Agregar Producto"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleProductSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.descripcion}
                  onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej: Caja de frutas frescas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Producto *
                </label>
                <select
                  required
                  value={productForm.tipo_contenido}
                  onChange={(e) => setProductForm({ 
                    ...productForm, 
                    tipo_contenido: e.target.value,
                    id_calendario_embarque: "" // Reset calendar selection when type changes
                  })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposProductos.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre_tipo}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.peso}
                    onChange={(e) => setProductForm({ ...productForm, peso: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volumen (m³)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.volumen}
                    onChange={(e) => setProductForm({ ...productForm, volumen: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comercializadora
                </label>
                <input
                  type="text"
                  value={productForm.comercializadora}
                  onChange={(e) => setProductForm({ ...productForm, comercializadora: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nombre de la empresa proveedora"
                />
              </div>

              {productForm.tipo_contenido && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Embarque Programada
                  </label>
                  {(() => {
                    const availableCalendarios = getCalendarioByProductType(productForm.tipo_contenido);
                    const nonFullCalendarios = availableCalendarios.filter(cal => !cal.isFull);
                    
                    if (availableCalendarios.length === 0) {
                      return (
                        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                          No hay embarques programados que acepten este tipo de producto
                        </p>
                      );
                    }
                    
                    return (
                      <>
                        <select
                          value={productForm.id_calendario_embarque}
                          onChange={(e) => setProductForm({ ...productForm, id_calendario_embarque: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Sin asignar</option>
                          {availableCalendarios.map((cal) => (
                            <option 
                              key={cal.id} 
                              value={cal.id}
                              disabled={cal.isFull}
                              className={cal.isFull ? "text-gray-400" : ""}
                            >
                              {new Date(cal.fecha_embarque).toLocaleDateString("es-ES", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })} - {cal.nombre_barco}
                              {cal.nombre_destino ? ` → ${cal.nombre_destino}` : ""}
                              {cal.isFull && ` [LLENO - ${cal.isFullByPeso && cal.isFullByVolumen ? "Peso y Volumen" : cal.isFullByPeso ? "Peso" : "Volumen"}]`}
                            </option>
                          ))}
                        </select>
                        {nonFullCalendarios.length === 0 && (
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-2">
                            ⚠️ Todos los embarques disponibles están llenos. No se pueden asignar más productos.
                          </p>
                        )}
                        {productForm.id_calendario_embarque && (() => {
                          const selected = availableCalendarios.find(c => c.id.toString() === productForm.id_calendario_embarque);
                          if (selected && (selected.pesoPercent >= 70 || selected.volumenPercent >= 70)) {
                            return (
                              <div className={`text-sm p-2 rounded-lg mt-2 ${selected.isFull ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                Capacidad: Peso {selected.pesoPercent.toFixed(0)}% | Volumen {selected.volumenPercent.toFixed(0)}%
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingProduct ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingServicio ? "Editar Servicio" : "Agregar Servicio"}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <form onSubmit={handleServiceSubmit} className="p-4 sm:p-6 space-y-4">
              {!editingServicio && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Servicio *
                  </label>
                  <select
                    required
                    value={serviceForm.id_servicio}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar servicio</option>
                    {serviciosDisponibles.map((servicio) => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.tipo_servicio}
                        {servicio.tipo_transporte && ` - ${servicio.tipo_transporte}`}
                        {servicio.tipo_embalaje && ` - ${servicio.tipo_embalaje}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={serviceForm.cantidad}
                    onChange={(e) => setServiceForm({ ...serviceForm, cantidad: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Unitario *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={serviceForm.costo_unitario}
                    onChange={(e) => setServiceForm({ ...serviceForm, costo_unitario: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={serviceForm.notas}
                  onChange={(e) => setServiceForm({ ...serviceForm, notas: e.target.value })}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Información adicional sobre el servicio"
                />
              </div>

              {serviceForm.cantidad && serviceForm.costo_unitario && (
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${(parseFloat(serviceForm.cantidad) * parseFloat(serviceForm.costo_unitario)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="flex-1 px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {editingServicio ? "Actualizar" : "Agregar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Subir documento
              </h3>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de documento
                </label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar tipo</option>
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo.id} value={tipo.nombre_tipo}>
                      {tipo.nombre_tipo}
                    </option>
                  ))}
                </select>
                {tiposDocumento.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay tipos de documento configurados. Vaya a Configuración → Tipos de Documento para crearlos.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mb-2" />
                    <span className="text-xs sm:text-sm text-gray-600 break-all px-2">
                      {selectedFile ? selectedFile.name : "Haz clic para seleccionar un archivo"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setTipoDocumento("");
                }}
                className="flex-1 px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={uploadingFile}
              >
                Cancelar
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploadingFile || !tipoDocumento}
                className="flex-1 px-4 py-2 text-sm sm:text-base bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingFile ? "Subiendo..." : "Subir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
