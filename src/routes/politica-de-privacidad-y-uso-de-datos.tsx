import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/politica-de-privacidad-y-uso-de-datos")({
  head: () => ({
    meta: [{ title: "Política de Privacidad y Uso de Datos" }],
  }),
  component: PrivacidadPage,
});

function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition font-medium text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 prose prose-slate dark:prose-invert">
        <h1 className="font-display text-3xl font-bold text-primary mb-2">Política de Privacidad y Tratamiento de Datos Personales</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Fecha de última actualización: <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[DÍA DE MES DE AÑO]</span>
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">1. Responsable del Tratamiento</h2>
        <p>
          <strong className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[NOMBRE DE TU EMPRESA]</strong>, con domicilio en <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[DIRECCIÓN FÍSICA]</span> en <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[CIUDAD/MUNICIPIO]</span> y correo electrónico de contacto <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[CORREO ELECTRÓNICO]</span>; es responsable de la recopilación y tratamiento de sus datos personales.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">2. Datos que Recopilamos</h2>
        <p>Recopilamos los siguientes tipos de datos personales:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Datos personales de identificación y contacto:</strong> nombre y apellidos, número de documento de identidad, correo electrónico, número de teléfono, ciudad o municipio de residencia y dirección.</li>
          <li><strong>Datos de transacciones comerciales:</strong> información relacionada con compras, pedidos, productos o servicios adquiridos, métodos de pago y facturación.</li>
          <li><strong>Datos técnicos y de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas, duración de la visita, uso de cookies y tecnologías similares en nuestro sitio web.</li>
          <li><strong>Otros datos específicos:</strong> <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[Agregue aquí cualquier tipo de dato adicional que su empresa recopile. Si no aplica, elimine esta línea]</span></li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">3. Cómo Recopilamos los Datos Personales</h2>
        <p>Los datos personales pueden ser recolectados a través de los siguientes medios:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Formularios físicos o digitales de contacto, registro o suscripción.</li>
          <li>Atención presencial en nuestras instalaciones.</li>
          <li>Comunicación directa a través de WhatsApp, llamadas telefónicas y correo electrónico.</li>
          <li>Interacción con nuestras redes sociales, incluyendo mensajes directos y formularios habilitados en dichas plataformas.</li>
          <li>Procesos de compra, contratación y prestación de servicios.</li>
          <li>Cookies y tecnologías similares utilizadas en nuestro sitio web.</li>
          <li><strong>Otros medios:</strong> <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[Agregue aquí cualquier otro medio. Si no aplica, elimine esta línea]</span></li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">4. Finalidades de la Recopilación</h2>
        <p>Los datos personales recolectados serán utilizados para las siguientes finalidades:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Gestionar el agendamiento de citas, atención, seguimiento y prestación de los servicios o productos ofrecidos.</li>
          <li>Procesar pedidos, ventas y transacciones comerciales.</li>
          <li>Realizar procesos administrativos, contables, de facturación y cobro.</li>
          <li>Dar cumplimiento a obligaciones legales, contractuales y regulatorias aplicables.</li>
          <li>Enviar información relacionada con pedidos, citas, recordatorios, seguimientos y comunicaciones relacionadas con el servicio.</li>
          <li>Enviar información educativa, comunicacional, promocional o comercial relacionada con nuestros productos o servicios.</li>
          <li>Realizar análisis estadísticos, estudios de mercado y mejora continua de nuestros servicios.</li>
          <li>Gestionar programas de fidelización, promociones y beneficios para clientes.</li>
          <li><strong>Otras finalidades específicas:</strong> <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[Agregue aquí cualquier otra finalidad. Si no aplica, elimine esta línea]</span></li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">5. Medidas de Seguridad</h2>
        <p>
          <strong className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[NOMBRE DE TU EMPRESA]</strong> implementa medidas técnicas y administrativas para garantizar la seguridad de los datos personales y para evitar su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">6. Transmisión de Datos Personales a Terceros</h2>
        <p>
          <strong className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[NOMBRE DE TU EMPRESA]</strong> podrá transmitir datos personales a terceros únicamente cuando sea necesario para el cumplimiento de las finalidades autorizadas por el titular, tales como:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Proveedores de servicios de pago, pasarelas de pago y facturación electrónica.</li>
          <li>Proveedores de servicios tecnológicos, hosting, soporte web y almacenamiento.</li>
          <li>Proveedores de servicios de comunicación y mensajería (WhatsApp Business, email, SMS).</li>
          <li>Empresas de logística y mensajería para el envío de productos.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">7. Derechos de los Titulares</h2>
        <p>
          De conformidad con la Ley 1581 de 2012, el titular de los datos personales tiene derecho a conocer, actualizar, rectificar y solicitar la supresión de sus datos, así como a revocar la autorización otorgada.
          Para ejercer estos derechos, el titular podrá comunicarse a través del correo electrónico <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[CORREO ELECTRÓNICO]</span>.
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">8. Canales de Contacto</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Correo electrónico:</strong> <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[CORREO ELECTRÓNICO]</span></li>
          <li><strong>Teléfono:</strong> <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[TELÉFONO O ELIMINAR]</span></li>
          <li><strong>Dirección:</strong> <span className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[DIRECCIÓN FÍSICA]</span></li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4 text-foreground">9. Actualización de la Política</h2>
        <p>
          <strong className="bg-yellow-200/50 dark:bg-yellow-900/50 px-1 rounded">[NOMBRE DE TU EMPRESA]</strong> se reserva el derecho de modificar o actualizar la presente Política de Tratamiento de Datos Personales en cualquier momento. Cualquier modificación será informada a través del sitio web.
        </p>

        <div className="mt-12 pt-8 border-t border-border/60 text-sm text-muted-foreground text-center">
          <p>Esta política ha sido elaborada en cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 sobre Protección de Datos Personales en Colombia.</p>
        </div>
      </main>
    </div>
  );
}
