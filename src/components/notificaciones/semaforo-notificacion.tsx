"use client";

import { cn } from "@/lib/utils";
import {
  Circle,
  Clock,
  Mail,
  Eye,
  CheckCircle,
  AlertTriangle,
  Shield,
  Loader2,
  UserCheck,
  FileText,
  Truck,
  Timer,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { type EstadoSemaforo, SEMAFORO_INFO } from "@/lib/notifications/semaforo";

interface SemaforoNotificacionProps {
  estado: EstadoSemaforo | string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

// Mapeo de colores Tailwind para el semáforo
const colorClasses: Record<string, { bg: string; text: string; ring: string; pulse?: string }> = {
  gray: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    ring: "ring-gray-200",
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    ring: "ring-blue-200",
    pulse: "animate-pulse",
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    ring: "ring-yellow-200",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
    ring: "ring-green-200",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
    ring: "ring-red-200",
    pulse: "animate-pulse",
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-600",
    ring: "ring-emerald-200",
  },
  orange: {
    bg: "bg-orange-100",
    text: "text-orange-600",
    ring: "ring-orange-200",
  },
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    ring: "ring-amber-200",
    pulse: "animate-pulse",
  },
};

// Iconos por estado
const iconosPorEstado: Record<string, React.ComponentType<{ className?: string }>> = {
  pendiente: Clock,
  enviado: Mail,
  validado: UserCheck,
  abierto: Eye,
  leido: CheckCircle,
  alerta: AlertTriangle,
  pendiente_fisico: FileText,
  enviado_fisico: Truck,
  por_vencer: Timer,
  firme: Shield,
};

// Tamaños
const sizeClasses = {
  sm: {
    container: "p-1",
    icon: "h-3 w-3",
    text: "text-xs",
  },
  md: {
    container: "p-1.5",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  lg: {
    container: "p-2",
    icon: "h-5 w-5",
    text: "text-base",
  },
};

export function SemaforoNotificacion({
  estado,
  size = "md",
  showLabel = false,
  showTooltip = true,
  className,
}: SemaforoNotificacionProps) {
  // Obtener info del semáforo, con fallback a pendiente
  const info = SEMAFORO_INFO[estado as EstadoSemaforo] || SEMAFORO_INFO.pendiente;
  const colors = colorClasses[info.color] || colorClasses.gray;
  const sizeClass = sizeClasses[size];
  const Icon = iconosPorEstado[estado] || Circle;

  const semaforoElement = (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full ring-1",
        colors.bg,
        colors.ring,
        colors.pulse,
        sizeClass.container,
        showLabel && "pr-2.5",
        className
      )}
    >
      <Icon className={cn(colors.text, sizeClass.icon)} />
      {showLabel && (
        <span className={cn("font-medium", colors.text, sizeClass.text)}>
          {info.label}
        </span>
      )}
    </div>
  );

  if (!showTooltip) {
    return semaforoElement;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {semaforoElement}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{info.label}</p>
            <p className="text-sm text-muted-foreground">{info.descripcion}</p>
            {info.accionRequerida && (
              <p className="text-sm text-orange-600 font-medium">
                Acción: {info.accionRequerida}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Variante de Badge para usar en tablas/listas
interface SemaforoBadgeProps {
  estado: EstadoSemaforo | string;
  className?: string;
}

export function SemaforoBadge({ estado, className }: SemaforoBadgeProps) {
  const info = SEMAFORO_INFO[estado as EstadoSemaforo] || SEMAFORO_INFO.pendiente;
  const colors = colorClasses[info.color] || colorClasses.gray;
  const Icon = iconosPorEstado[estado] || Circle;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 font-normal",
              colors.bg,
              colors.text,
              colors.ring,
              colors.pulse,
              className
            )}
          >
            <Icon className="h-3 w-3" />
            {info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{info.label}</p>
            <p className="text-sm text-muted-foreground">{info.descripcion}</p>
            {info.accionRequerida && (
              <p className="text-sm text-orange-600 font-medium">
                Acción: {info.accionRequerida}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente de resumen de semáforos (para dashboard)
interface ResumenSemaforosProps {
  conteos: Record<EstadoSemaforo, number>;
  className?: string;
}

export function ResumenSemaforos({ conteos, className }: ResumenSemaforosProps) {
  const estados: EstadoSemaforo[] = [
    "pendiente",
    "enviado",
    "validado",
    "leido",
    "alerta",
    "pendiente_fisico",
    "enviado_fisico",
    "por_vencer",
    "firme",
  ];

  return (
    <div className={cn("flex items-center gap-4 flex-wrap", className)}>
      {estados.map((estado) => {
        const info = SEMAFORO_INFO[estado];
        const count = conteos[estado] || 0;
        const colors = colorClasses[info.color];
        const Icon = iconosPorEstado[estado];

        if (count === 0 && estado !== "alerta") return null;

        return (
          <TooltipProvider key={estado} delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                    colors.bg,
                    count > 0 && colors.pulse
                  )}
                >
                  <Icon className={cn("h-4 w-4", colors.text)} />
                  <span className={cn("font-semibold text-lg", colors.text)}>
                    {count}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{info.label}: {count} notificaciones</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

// Indicador de urgencia para alertas rojas
interface AlertaUrgenciaProps {
  cantidad: number;
  className?: string;
}

export function AlertaUrgencia({ cantidad, className }: AlertaUrgenciaProps) {
  if (cantidad === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200",
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
      <div>
        <p className="font-semibold text-red-700">
          {cantidad === 1
            ? "1 notificación requiere atención"
            : `${cantidad} notificaciones requieren atención`}
        </p>
        <p className="text-sm text-red-600">
          Pasaron más de 72hs sin confirmación de lectura. Considerá reenviar o generar carta documento.
        </p>
      </div>
    </div>
  );
}
