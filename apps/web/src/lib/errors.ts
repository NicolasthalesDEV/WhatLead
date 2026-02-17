/**
 * Sistema de erros personalizados do WhatLead CRM
 * Todas as mensagens em português para melhor UX
 */

import { NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================================
// CLASSES DE ERRO PERSONALIZADAS
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros de Autenticação (401)
export class UnauthorizedError extends AppError {
  constructor(message: string = "Você precisa estar autenticado para acessar este recurso") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message: string = "Email ou senha incorretos") {
    super(message, "INVALID_CREDENTIALS", 401);
  }
}

export class ExpiredTokenError extends AppError {
  constructor(message: string = "Sua sessão expirou. Faça login novamente") {
    super(message, "EXPIRED_TOKEN", 401);
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = "Token de autenticação inválido") {
    super(message, "INVALID_TOKEN", 401);
  }
}

// Erros de Permissão (403)
export class ForbiddenError extends AppError {
  constructor(message: string = "Você não tem permissão para acessar este recurso") {
    super(message, "FORBIDDEN", 403);
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(action: string) {
    super(
      `Você não tem permissão para ${action}. Entre em contato com o administrador`,
      "INSUFFICIENT_PERMISSIONS",
      403
    );
  }
}

// Erros de Recurso Não Encontrado (404)
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, "NOT_FOUND", 404);
  }
}

export class CustomerNotFoundError extends NotFoundError {
  constructor() {
    super("Cliente");
  }
}

export class OrderNotFoundError extends NotFoundError {
  constructor() {
    super("Pedido");
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor() {
    super("Produto");
  }
}

export class QuoteNotFoundError extends NotFoundError {
  constructor() {
    super("Orçamento");
  }
}

export class FlowNotFoundError extends NotFoundError {
  constructor() {
    super("Fluxo de chatbot");
  }
}

// Erros de Validação (400)
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class InvalidInputError extends ValidationError {
  constructor(field: string, reason: string) {
    super(`Campo inválido: ${field}. ${reason}`);
  }
}

export class MissingFieldError extends ValidationError {
  constructor(field: string) {
    super(`Campo obrigatório: ${field}`);
  }
}

export class InvalidEmailError extends ValidationError {
  constructor() {
    super("Email inválido. Digite um email válido");
  }
}

export class InvalidPhoneError extends ValidationError {
  constructor() {
    super("Telefone inválido. Use o formato internacional (ex: +5511999999999)");
  }
}

export class WeakPasswordError extends ValidationError {
  constructor() {
    super("Senha fraca. Use no mínimo 8 caracteres, incluindo letras e números");
  }
}

// Erros de Conflito (409)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class DuplicateEmailError extends ConflictError {
  constructor() {
    super("Este email já está em uso. Tente outro ou faça login");
  }
}

export class DuplicatePhoneError extends ConflictError {
  constructor() {
    super("Este telefone já está cadastrado no sistema");
  }
}

export class DuplicateSlugError extends ConflictError {
  constructor() {
    super("Este nome de empresa já está em uso. Escolha outro");
  }
}

export class DuplicateResourceError extends ConflictError {
  constructor(resource: string) {
    super(`${resource} já existe no sistema`);
  }
}

// Erros de Negócio (422)
export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE_ERROR", 422);
  }
}

export class InsufficientStockError extends BusinessRuleError {
  constructor(productName: string, available: number) {
    super(`Estoque insuficiente de "${productName}". Disponível: ${available} unidades`);
  }
}

export class InvalidOrderStatusError extends BusinessRuleError {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Não é possível ${attemptedAction} um pedido com status "${currentStatus}"`);
  }
}

export class PaymentAlreadyProcessedError extends BusinessRuleError {
  constructor() {
    super("Este pagamento já foi processado");
  }
}

export class QuoteExpiredError extends BusinessRuleError {
  constructor() {
    super("Este orçamento expirou e não pode mais ser aceito");
  }
}

export class InvalidAmountError extends BusinessRuleError {
  constructor(reason: string) {
    super(`Valor inválido: ${reason}`);
  }
}

// Erros de Rate Limit (429)
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      retryAfter
        ? `Muitas tentativas. Tente novamente em ${retryAfter} segundos`
        : "Muitas tentativas. Aguarde alguns minutos e tente novamente",
      "RATE_LIMIT_EXCEEDED",
      429,
      { retryAfter }
    );
  }
}

// Erros de Integração (502, 503)
export class IntegrationError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `Erro ao conectar com ${service}. Tente novamente em instantes`,
      "INTEGRATION_ERROR",
      502
    );
  }
}

export class WhatsAppError extends IntegrationError {
  constructor(message?: string) {
    super("WhatsApp", message);
  }
}

export class PaymentGatewayError extends IntegrationError {
  constructor(message?: string) {
    super("gateway de pagamento", message);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = "Erro ao acessar banco de dados. Tente novamente") {
    super(message, "DATABASE_ERROR", 500);
  }
}

// Erros Internos (500)
export class InternalServerError extends AppError {
  constructor(message: string = "Erro interno do servidor. Nossa equipe foi notificada") {
    super(message, "INTERNAL_SERVER_ERROR", 500);
  }
}

export class NotImplementedError extends AppError {
  constructor(feature: string) {
    super(
      `Funcionalidade "${feature}" ainda não está disponível`,
      "NOT_IMPLEMENTED",
      501
    );
  }
}

// ============================================================================
// HANDLER CENTRALIZADO DE ERROS
// ============================================================================

export interface ErrorResponseMeta {
  requestId: string;
  timestamp: string;
  handler?: string;
  [key: string]: any;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: ErrorResponseMeta;
}

/**
 * Formata erro para resposta JSON padronizada
 */
export function formatErrorResponse(
  error: Error | AppError,
  handler?: string,
  additionalMeta?: Record<string, any>
): ErrorResponse {
  const requestId = crypto.randomUUID();

  // Se for erro customizado (AppError)
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        ...(handler ? { handler } : {}),
        ...additionalMeta,
      },
    };
  }

  // Erro genérico - não expor detalhes ao usuário
  console.error(`[${handler || "unknown"}] Unhandled error:`, error);

  return {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro interno do servidor. Nossa equipe foi notificada",
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...(handler ? { handler } : {}),
      ...additionalMeta,
    },
  };
}

/**
 * Cria resposta NextResponse a partir de um erro
 */
export function errorResponse(
  error: Error | AppError,
  handler?: string,
  additionalMeta?: Record<string, any>
): NextResponse {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const response = formatErrorResponse(error, handler, additionalMeta);

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      "X-Request-Id": response.meta.requestId,
      ...(handler ? { "X-Route-Handler": handler } : {}),
    },
  });
}

// ============================================================================
// HELPERS DE VALIDAÇÃO
// ============================================================================

/**
 * Valida email
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new InvalidEmailError();
  }
}

/**
 * Valida telefone no formato E.164
 */
export function validatePhone(phone: string): void {
  const phoneRegex = /^\+[1-9]\d{10,14}$/;
  if (!phoneRegex.test(phone)) {
    throw new InvalidPhoneError();
  }
}

/**
 * Valida senha forte
 */
export function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new WeakPasswordError();
  }
  // Opcional: adicionar mais regras
  // if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
  //   throw new WeakPasswordError();
  // }
}

/**
 * Valida campo obrigatório
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === "") {
    throw new MissingFieldError(fieldName);
  }
}

/**
 * Valida valor positivo
 */
export function validatePositive(value: number, fieldName: string): void {
  if (value <= 0) {
    throw new InvalidInputError(fieldName, "deve ser maior que zero");
  }
}

// ============================================================================
// MENSAGENS DE ERRO AMIGÁVEIS
// ============================================================================

export const ERROR_MESSAGES = {
  // Autenticação
  AUTH: {
    LOGIN_FAILED: "Email ou senha incorretos. Verifique suas credenciais",
    SESSION_EXPIRED: "Sua sessão expirou. Faça login novamente",
    INVALID_TOKEN: "Token de autenticação inválido",
    ACCOUNT_LOCKED: "Sua conta foi bloqueada. Entre em contato com o suporte",
    EMAIL_NOT_VERIFIED: "Verifique seu email antes de continuar",
  },

  // Cadastro
  REGISTER: {
    EMAIL_EXISTS: "Este email já está em uso. Tente outro ou faça login",
    SLUG_EXISTS: "Este nome de empresa já está em uso. Escolha outro",
    WEAK_PASSWORD: "Senha fraca. Use no mínimo 8 caracteres",
    INVALID_EMAIL: "Email inválido",
  },

  // Clientes
  CUSTOMER: {
    NOT_FOUND: "Cliente não encontrado",
    PHONE_EXISTS: "Este telefone já está cadastrado",
    INVALID_PHONE: "Telefone inválido. Use formato internacional (+5511999999999)",
    CANNOT_DELETE: "Não é possível excluir cliente com pedidos ativos",
  },

  // Pedidos
  ORDER: {
    NOT_FOUND: "Pedido não encontrado",
    EMPTY_CART: "Adicione pelo menos um produto ao pedido",
    INVALID_STATUS: "Status de pedido inválido",
    ALREADY_PAID: "Este pedido já foi pago",
    CANNOT_CANCEL: "Não é possível cancelar pedido já pago",
  },

  // Produtos
  PRODUCT: {
    NOT_FOUND: "Produto não encontrado",
    INSUFFICIENT_STOCK: "Estoque insuficiente",
    INVALID_PRICE: "Preço inválido",
    SLUG_EXISTS: "Produto com este nome já existe",
  },

  // Orçamentos
  QUOTE: {
    NOT_FOUND: "Orçamento não encontrado",
    EXPIRED: "Este orçamento expirou",
    ALREADY_ACCEPTED: "Este orçamento já foi aceito",
    EMPTY: "Adicione pelo menos um item ao orçamento",
  },

  // Pagamentos
  PAYMENT: {
    FAILED: "Pagamento falhou. Tente novamente",
    GATEWAY_ERROR: "Erro no gateway de pagamento",
    INVALID_AMOUNT: "Valor de pagamento inválido",
    ALREADY_PROCESSED: "Este pagamento já foi processado",
  },

  // WhatsApp
  WHATSAPP: {
    SEND_FAILED: "Erro ao enviar mensagem no WhatsApp",
    INVALID_NUMBER: "Número de WhatsApp inválido",
    NOT_CONFIGURED: "WhatsApp não está configurado. Configure nas configurações",
  },

  // Chatbot
  CHATBOT: {
    FLOW_NOT_FOUND: "Fluxo de chatbot não encontrado",
    INVALID_NODE: "Nó de chatbot inválido",
    EXECUTION_FAILED: "Erro ao executar chatbot",
    NO_FLOWS: "Nenhum fluxo de chatbot configurado",
  },

  // Geral
  GENERAL: {
    NOT_FOUND: "Recurso não encontrado",
    FORBIDDEN: "Você não tem permissão para acessar este recurso",
    RATE_LIMIT: "Muitas tentativas. Aguarde alguns minutos",
    INTERNAL_ERROR: "Erro interno do servidor. Nossa equipe foi notificada",
    BAD_REQUEST: "Requisição inválida",
    METHOD_NOT_ALLOWED: "Método HTTP não permitido",
  },
};
