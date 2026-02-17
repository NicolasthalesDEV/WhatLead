"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Survey = {
  id: string;
  name: string;
  description: string | null;
  question: string;
  active: boolean;
  sendAfterOrderPaid: boolean;
  sendDelayMinutes: number;
  createdAt: string;
  metrics: {
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    npsScore: number | null;
  };
};

export default function NPSPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    question: "Em uma escala de 0 a 10, quanto você recomendaria nossos serviços?",
    sendAfterOrderPaid: true,
    sendDelayMinutes: 60,
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const res = await fetch("/api/nps/surveys");
      if (res.ok) {
        const data = await res.json();
        setSurveys(data);
      }
    } catch (error) {
      console.error("Error fetching surveys:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/nps/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setFormData({
          name: "",
          description: "",
          question: "Em uma escala de 0 a 10, quanto você recomendaria nossos serviços?",
          sendAfterOrderPaid: true,
          sendDelayMinutes: 60,
        });
        fetchSurveys();
      } else {
        alert("Erro ao criar pesquisa");
      }
    } catch (error) {
      console.error("Error creating survey:", error);
      alert("Erro ao criar pesquisa");
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/nps/surveys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (res.ok) {
        fetchSurveys();
      }
    } catch (error) {
      console.error("Error toggling survey:", error);
    }
  };

  const deleteSurvey = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta pesquisa?")) return;

    try {
      const res = await fetch(`/api/nps/surveys/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSurveys();
      } else {
        const data = await res.json();
        if (data.error?.code === "HAS_RESPONSES") {
          alert("Não é possível deletar uma pesquisa que já possui respostas");
        } else {
          alert("Erro ao deletar pesquisa");
        }
      }
    } catch (error) {
      console.error("Error deleting survey:", error);
      alert("Erro ao deletar pesquisa");
    }
  };

  const getSentimentColor = (nps: number | null) => {
    if (nps === null) return "text-gray-500";
    if (nps >= 70) return "text-green-600";
    if (nps >= 50) return "text-yellow-600";
    if (nps >= 0) return "text-orange-600";
    return "text-red-600";
  };

  const getSentimentLabel = (nps: number | null) => {
    if (nps === null) return "Sem dados";
    if (nps >= 70) return "Excelente";
    if (nps >= 50) return "Bom";
    if (nps >= 0) return "Regular";
    return "Crítico";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Pesquisas NPS</h1>
            <p className="text-gray-600 mt-1">
              Gerencie pesquisas de satisfação (Net Promoter Score)
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? "Cancelar" : "+ Nova Pesquisa"}
          </button>
        </div>

        {/* Formulário de criação */}
        {showCreateForm && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">Criar Nova Pesquisa</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Pesquisa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pergunta *
                </label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendAfterOrderPaid"
                  checked={formData.sendAfterOrderPaid}
                  onChange={(e) =>
                    setFormData({ ...formData, sendAfterOrderPaid: e.target.checked })
                  }
                  className="rounded"
                />
                <label htmlFor="sendAfterOrderPaid" className="text-sm text-gray-700">
                  Enviar automaticamente após pedido pago
                </label>
              </div>

              {formData.sendAfterOrderPaid && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay de envio (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.sendDelayMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, sendDelayMinutes: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tempo de espera após pagamento confirmado
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Criar Pesquisa
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de pesquisas */}
        {surveys.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-500 mb-4">Nenhuma pesquisa criada ainda</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar Primeira Pesquisa
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {surveys.map((survey) => (
              <div key={survey.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{survey.name}</h3>
                      {survey.active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Ativa
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                          Inativa
                        </span>
                      )}
                    </div>
                    {survey.description && (
                      <p className="text-sm text-gray-600 mb-2">{survey.description}</p>
                    )}
                    <p className="text-sm text-gray-700 italic">"{survey.question}"</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/nps/${survey.id}`}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Ver Detalhes
                    </Link>
                    <button
                      onClick={() => toggleActive(survey.id, survey.active)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      {survey.active ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => deleteSurvey(survey.id)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      Deletar
                    </button>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Respostas</p>
                    <p className="text-2xl font-bold">{survey.metrics.totalResponses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">NPS Score</p>
                    <p className={`text-2xl font-bold ${getSentimentColor(survey.metrics.npsScore)}`}>
                      {survey.metrics.npsScore !== null ? survey.metrics.npsScore : "-"}
                    </p>
                    <p className={`text-xs ${getSentimentColor(survey.metrics.npsScore)}`}>
                      {getSentimentLabel(survey.metrics.npsScore)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Promotores</p>
                    <p className="text-2xl font-bold text-green-600">{survey.metrics.promoters}</p>
                    {survey.metrics.totalResponses > 0 && (
                      <p className="text-xs text-gray-500">
                        {Math.round((survey.metrics.promoters / survey.metrics.totalResponses) * 100)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Neutros</p>
                    <p className="text-2xl font-bold text-yellow-600">{survey.metrics.passives}</p>
                    {survey.metrics.totalResponses > 0 && (
                      <p className="text-xs text-gray-500">
                        {Math.round((survey.metrics.passives / survey.metrics.totalResponses) * 100)}%
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Detratores</p>
                    <p className="text-2xl font-bold text-red-600">{survey.metrics.detractors}</p>
                    {survey.metrics.totalResponses > 0 && (
                      <p className="text-xs text-gray-500">
                        {Math.round((survey.metrics.detractors / survey.metrics.totalResponses) * 100)}%
                      </p>
                    )}
                  </div>
                </div>

                {survey.sendAfterOrderPaid && (
                  <div className="mt-4 text-sm text-gray-600">
                    📤 Envio automático após {survey.sendDelayMinutes} minutos do pagamento confirmado
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
