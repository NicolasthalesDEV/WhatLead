"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

export interface AutoMessages {
  welcome?: {
    enabled: boolean;
    message: string;
  };
  afterHours?: {
    enabled: boolean;
    message: string;
  };
  absent?: {
    enabled: boolean;
    message: string;
  };
}

interface AutoMessagesConfigProps {
  value: AutoMessages;
  onChange: (value: AutoMessages) => void;
}

const DEFAULT_MESSAGES = {
  welcome: {
    enabled: false,
    message: 'Olá! Seja bem-vindo(a) 👋\n\nObrigado por entrar em contato. Como posso ajudar você hoje?',
  },
  afterHours: {
    enabled: false,
    message: 'Olá! Você nos enviou uma mensagem fora do nosso horário de atendimento.\n\nRetornaremos em breve! ⏰',
  },
  absent: {
    enabled: false,
    message: 'Olá! No momento estamos ausentes.\n\nDeixe sua mensagem que retornaremos assim que possível. 💬',
  },
};

export function AutoMessagesConfig({ value, onChange }: AutoMessagesConfigProps) {
  const handleToggle = (type: keyof AutoMessages, enabled: boolean) => {
    const currentMsg = value[type] || DEFAULT_MESSAGES[type];
    
    onChange({
      ...value,
      [type]: {
        ...currentMsg,
        enabled,
      },
    });
  };

  const handleMessageChange = (type: keyof AutoMessages, message: string) => {
    const currentMsg = value[type] || DEFAULT_MESSAGES[type];
    
    onChange({
      ...value,
      [type]: {
        ...currentMsg,
        message,
      },
    });
  };

  const getConfig = (type: keyof AutoMessages) => {
    return value[type] || DEFAULT_MESSAGES[type];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Mensagens Automáticas
        </CardTitle>
        <CardDescription>
          Configure mensagens automáticas para diferentes cenários de atendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Welcome Message */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="welcome-enabled"
              checked={getConfig('welcome').enabled}
              onChange={(e) => handleToggle('welcome', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="welcome-enabled" className="text-base font-medium">
              Mensagem de Boas-vindas
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Enviada automaticamente quando um cliente inicia uma conversa pela primeira vez
          </p>
          <Textarea
            value={getConfig('welcome').message}
            onChange={(e) => handleMessageChange('welcome', e.target.value)}
            disabled={!getConfig('welcome').enabled}
            placeholder="Digite a mensagem de boas-vindas..."
            rows={3}
            className={!getConfig('welcome').enabled ? 'opacity-50' : ''}
          />
        </div>

        {/* After Hours Message */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="afterhours-enabled"
              checked={getConfig('afterHours').enabled}
              onChange={(e) => handleToggle('afterHours', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="afterhours-enabled" className="text-base font-medium">
              Mensagem Fora do Horário
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Enviada quando receber mensagem fora do horário de atendimento configurado
          </p>
          <Textarea
            value={getConfig('afterHours').message}
            onChange={(e) => handleMessageChange('afterHours', e.target.value)}
            disabled={!getConfig('afterHours').enabled}
            placeholder="Digite a mensagem para fora do horário..."
            rows={3}
            className={!getConfig('afterHours').enabled ? 'opacity-50' : ''}
          />
        </div>

        {/* Absent Message */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="absent-enabled"
              checked={getConfig('absent').enabled}
              onChange={(e) => handleToggle('absent', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="absent-enabled" className="text-base font-medium">
              Mensagem de Ausência
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Ative manualmente quando precisar se ausentar temporariamente
          </p>
          <Textarea
            value={getConfig('absent').message}
            onChange={(e) => handleMessageChange('absent', e.target.value)}
            disabled={!getConfig('absent').enabled}
            placeholder="Digite a mensagem de ausência..."
            rows={3}
            className={!getConfig('absent').enabled ? 'opacity-50' : ''}
          />
        </div>

        <div className="pt-2 text-xs text-muted-foreground">
          <p>💡 Dica: Use variáveis dinâmicas nas mensagens:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2">
            <li><code className="bg-muted px-1 py-0.5 rounded">{'{{nome}}'}</code> - Nome do cliente</li>
            <li><code className="bg-muted px-1 py-0.5 rounded">{'{{empresa}}'}</code> - Nome da empresa</li>
            <li><code className="bg-muted px-1 py-0.5 rounded">{'{{horario}}'}</code> - Horário de atendimento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
