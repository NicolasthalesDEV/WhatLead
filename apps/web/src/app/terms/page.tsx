import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Serviço — WhatLead',
  description: 'Termos e condições de uso da plataforma WhatLead',
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Termos de Serviço</h1>
      <p className="text-sm text-gray-500 mb-10">Última atualização: fevereiro de 2026</p>

      <section className="space-y-8 text-base leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Aceitação dos termos</h2>
          <p>
            Ao acessar ou usar a plataforma WhatLead, você concorda com estes Termos de Serviço e
            com nossa{' '}
            <a href="/privacy" className="text-primary underline">
              Política de Privacidade
            </a>
            . Se não concordar com qualquer parte destes termos, não utilize o serviço.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Descrição do serviço</h2>
          <p>
            O WhatLead é uma plataforma de CRM e automação de atendimento via WhatsApp Business API.
            O serviço permite gerenciar conversas, automatizar respostas, enviar mensagens e
            acompanhar clientes.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. Uso da plataforma</h2>
          <p>Ao utilizar o WhatLead, você se compromete a:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Cumprir todos os Termos da WhatsApp Business API e políticas da Meta</li>
            <li>Não enviar spam, mensagens não solicitadas ou conteúdo ilegal</li>
            <li>Manter a segurança das suas credenciais de acesso</li>
            <li>Usar a plataforma apenas para fins legítimos de negócio</li>
            <li>Obter o consentimento dos destinatários antes de enviar mensagens</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Responsabilidades</h2>
          <p>
            O WhatLead não se responsabiliza por: interrupções na API da Meta/WhatsApp, bloqueios de
            conta por violação das políticas da Meta, conteúdo enviado pelos usuários, ou perdas
            decorrentes do uso indevido da plataforma.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Planos e pagamentos</h2>
          <p>
            Os planos e preços estão disponíveis na plataforma. O cancelamento pode ser feito a
            qualquer momento. Não há reembolso para períodos já pagos, exceto quando exigido por lei.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Suspensão e encerramento</h2>
          <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos, as
            políticas da Meta ou que representem risco à segurança da plataforma.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Propriedade intelectual</h2>
          <p>
            Todo o código, design e conteúdo da plataforma WhatLead são propriedade exclusiva dos
            seus desenvolvedores. É proibida a reprodução, modificação ou distribuição sem
            autorização prévia.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Lei aplicável</h2>
          <p>
            Estes termos são regidos pelas leis da República Federativa do Brasil, em especial a Lei
            Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e o Código de Defesa do
            Consumidor.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Contato</h2>
          <p>
            Dúvidas sobre estes termos:{' '}
            <a href="mailto:contato@whatlead.com.br" className="text-primary underline">
              contato@whatlead.com.br
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
