"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type SurveyDetail = {
  id: string;
  name: string;
  description: string | null;
  question: string;
  active: boolean;
  metrics: {
    totalResponses: number;
    promoters: number;
    passives: number;
    detractors: number;
    npsScore: number | null;
    averageScore: number | null;
    scoreDistribution: Array<{ score: number; count: number }>;
    recentComments: Array<{
      id: string;
      score: number;
      comment: string;
      customerName: string;
      respondedAt: string;
    }>;
  };
};

export default function NPSSurveyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurvey();
  }, [id]);

  const fetchSurvey = async () => {
    try {
      const res = await fetch(`/api/nps/surveys/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSurvey(data);
      }
    } catch (error) {
      console.error("Error fetching survey:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 9) return "text-green-600 bg-green-50";
    if (score >= 7) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-6">
        <p>Pesquisa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/nps"
            className="text-blue-600 hover:underline mb-2 inline-block"
          >
            ← Voltar para pesquisas
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{survey.name}</h1>
              {survey.description && (
                <p className="text-gray-600 mt-1">{survey.description}</p>
              )}
              <p className="text-gray-700 italic mt-2">"{survey.question}"</p>
            </div>
            <div>
              {survey.active ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Ativa
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  Inativa
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPIs principais */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">Total de Respostas</p>
            <p className="text-3xl font-bold">{survey.metrics.totalResponses}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">NPS Score</p>
            <p className={`text-3xl font-bold ${survey.metrics.npsScore !== null
                ? survey.metrics.npsScore >= 70 ? "text-green-600"
                  : survey.metrics.npsScore >= 50 ? "text-yellow-600"
                    : survey.metrics.npsScore >= 0 ? "text-orange-600"
                      : "text-red-600"
                : "text-gray-400"
              }`}>
              {survey.metrics.npsScore !== null ? survey.metrics.npsScore : "-"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {survey.metrics.npsScore !== null
                ? survey.metrics.npsScore >= 70 ? "Excelente"
                  : survey.metrics.npsScore >= 50 ? "Bom"
                    : survey.metrics.npsScore >= 0 ? "Regular"
                      : "Crítico"
                : "Sem dados"}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">Promotores (9-10)</p>
            <p className="text-3xl font-bold text-green-600">{survey.metrics.promoters}</p>
            {survey.metrics.totalResponses > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((survey.metrics.promoters / survey.metrics.totalResponses) * 100)}%
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">Neutros (7-8)</p>
            <p className="text-3xl font-bold text-yellow-600">{survey.metrics.passives}</p>
            {survey.metrics.totalResponses > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((survey.metrics.passives / survey.metrics.totalResponses) * 100)}%
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-gray-600 mb-1">Detratores (0-6)</p>
            <p className="text-3xl font-bold text-red-600">{survey.metrics.detractors}</p>
            {survey.metrics.totalResponses > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((survey.metrics.detractors / survey.metrics.totalResponses) * 100)}%
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Distribuição de Scores */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Distribuição de Scores</h2>
            <div className="space-y-2">
              {survey.metrics.scoreDistribution.map((item) => (
                <div key={item.score} className="flex items-center gap-3">
                  <div className="w-8 text-sm text-gray-600">{item.score}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    {item.count > 0 && (
                      <div
                        className={`h-full rounded-full ${item.score >= 9 ? "bg-green-500"
                            : item.score >= 7 ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        style={{
                          width: `${(item.count / survey.metrics.totalResponses) * 100}%`,
                        }}
                      />
                    )}
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium">
                      {item.count > 0 && `${item.count} respostas`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comentários Recentes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Comentários Recentes</h2>
            {survey.metrics.recentComments.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum comentário ainda</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {survey.metrics.recentComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-l-4 pl-3 py-2"
                    style={{
                      borderColor:
                        comment.score >= 9 ? "#10b981"
                          : comment.score >= 7 ? "#f59e0b"
                            : "#ef4444",
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{comment.customerName}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSentimentColor(comment.score)}`}>
                          {comment.score}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(comment.respondedAt), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Média */}
        {survey.metrics.averageScore !== null && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-2">Média de Avaliação</h2>
            <p className="text-3xl font-bold text-blue-600">
              {survey.metrics.averageScore.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">de 0 a 10</p>
          </div>
        )}
      </div>
    </div>
  );
}
