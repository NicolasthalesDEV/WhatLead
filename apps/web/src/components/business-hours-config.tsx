"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

interface BusinessHoursConfigProps {
  value: BusinessHours;
  onChange: (value: BusinessHours) => void;
}

const DAYS = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const;

const DEFAULT_HOURS: DayHours = {
  open: '09:00',
  close: '18:00',
  closed: false,
};

export function BusinessHoursConfig({ value, onChange }: BusinessHoursConfigProps) {
  const handleDayChange = (day: string, field: keyof DayHours, val: string | boolean) => {
    const currentDay = value[day as keyof BusinessHours] || { ...DEFAULT_HOURS };
    
    onChange({
      ...value,
      [day]: {
        ...currentDay,
        [field]: val,
      },
    });
  };

  const getDayHours = (day: string): DayHours => {
    return value[day as keyof BusinessHours] || { ...DEFAULT_HOURS };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horário de Atendimento
        </CardTitle>
        <CardDescription>
          Configure os horários de funcionamento da sua empresa por dia da semana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map(({ key, label }) => {
          const hours = getDayHours(key);
          
          return (
            <div key={key} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="w-32 flex-shrink-0">
                <Label className="text-sm font-medium">{label}</Label>
              </div>
              
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${key}-closed`}
                    checked={hours.closed}
                    onChange={(e) => handleDayChange(key, 'closed', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor={`${key}-closed`} className="text-sm text-muted-foreground">
                    Fechado
                  </Label>
                </div>
                
                {!hours.closed && (
                  <>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${key}-open`} className="text-xs text-muted-foreground w-10">
                        Abre:
                      </Label>
                      <Input
                        id={`${key}-open`}
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleDayChange(key, 'open', e.target.value)}
                        className="w-28"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${key}-close`} className="text-xs text-muted-foreground w-12">
                        Fecha:
                      </Label>
                      <Input
                        id={`${key}-close`}
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleDayChange(key, 'close', e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 text-xs text-muted-foreground">
          <p>💡 Dica: Estes horários podem ser usados para:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2">
            <li>Mostrar disponibilidade no catálogo público</li>
            <li>Ativar mensagens automáticas fora do horário</li>
            <li>Relatórios de atendimento dentro/fora do expediente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
