import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — WhatLead',
  description: 'Política de privacidade e proteção de dados do WhatLead',
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-gray-500 mb-10">Última atualização: fevereiro de 2026</p>

      <section className="space-y-8 text-base leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. Informações que coletamos</h2>
          <p>
            O WhatLead coleta informações necessárias para o funcionamento da plataforma de
            relacionamento com clientes via WhatsApp, incluindo: nome, e-mail, número de telefone,
            histórico de conversas e dados de uso da plataforma.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Como usamos suas informações</h2>
          <p>
            Utilizamos as informações coletadas exclusivamente para: fornecer e melhorar nossos
            serviços, processar transações, enviar comunicações relacionadas ao serviço e cumprir
            obrigações legais. Não vendemos ou compartilhamos dados pessoais com terceiros para fins
            comerciais.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. Integração com o WhatsApp (Meta)</h2>
          <p>
            O WhatLead utiliza a WhatsApp Business API, fornecida pela Meta Platforms, Inc. Ao usar
            nossa plataforma, você concorda com os{' '}
            <a
              href="https://www.whatsapp.com/legal/business-policy"
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Termos de Serviço do WhatsApp Business
            </a>
            . As conversas são transmitidas via API da Meta e armazenadas nos nossos servidores de
            acordo com esta política.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Armazenamento e segurança</h2>
          <p>
            Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em
            repouso. Adotamos medidas técnicas e organizacionais adequadas para proteger suas
            informações contra acesso não autorizado.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Seus direitos</h2>
          <p>
            Você tem direito a: acessar seus dados pessoais, corrigir informações incorretas,
            solicitar a exclusão dos seus dados e portabilidade. Para exercer qualquer um desses
            direitos, entre em contato conosco pelo e-mail abaixo.
          </p>
        </div>

        <div id="data-deletion">
          <h2 className="text-xl font-semibold mb-2">6. Exclusão de dados</h2>
          <p>
            Para solicitar a exclusão completa dos seus dados da plataforma WhatLead, envie um
            e-mail para{' '}
            <a href="mailto:contato@whatlead.com.br" className="text-primary underline">
              contato@whatlead.com.br
            </a>{' '}
            com o assunto "Exclusão de dados". Processaremos sua solicitação em até 30 dias. Você
            também pode excluir sua conta diretamente no painel em{' '}
            <strong>Configurações → Conta → Excluir conta</strong>.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Cookies</h2>
          <p>
            Utilizamos cookies estritamente necessários para autenticação e funcionamento da
            plataforma. Não utilizamos cookies de rastreamento ou publicidade de terceiros.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos os usuários sobre
            mudanças significativas por e-mail ou via notificação na plataforma.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Contato</h2>
          <p>
            Para dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>E-mail: <a href="mailto:contato@whatlead.com.br" className="text-primary underline">contato@whatlead.com.br</a></li>
            <li>Site: <a href="https://what-lead-web.vercel.app" className="text-primary underline">what-lead-web.vercel.app</a></li>
          </ul>
        </div>
      </section>
    </main>
  );
}
