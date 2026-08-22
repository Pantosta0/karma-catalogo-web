interface Props {
  logoUrl?: string;
}

export function LoadingScreen({ logoUrl: logoProp }: Props) {
  const logoUrl = logoProp || "/favicon.png";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8">
      <div className="relative flex items-center justify-center">
        {/* Anillo pulsante de fondo */}
        <span
          className="karma-loader-ring absolute h-28 w-28 rounded-full bg-primary/20 animate-ping"
          style={{ animationDuration: "1.6s" }}
        />
        <span className="absolute h-20 w-20 rounded-full bg-primary/10" />

        {/* Logo con efecto fill de color */}
        {logoUrl && (
          <div className="relative h-16 w-16">
            {/* Capa base: escala de grises (estado "vacío") */}
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: "grayscale(1) brightness(0.35)" }}
            />
            {/* Capa color: se revela de abajo hacia arriba */}
            <img
              src={logoUrl}
              alt="Karma"
              className="karma-loader-fill absolute inset-0 w-full h-full object-contain"
              style={{
                animation: "karma-fill 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards",
              }}
            />
          </div>
        )}
      </div>
      <p className="font-display text-[11px] tracking-[0.35em] text-muted-foreground">
        CARGANDO
      </p>
    </div>
  );
}
