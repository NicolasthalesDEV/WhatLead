# 🔒 Correção de Segurança - Tokens Expostos

## ⚠️ AÇÃO URGENTE NECESSÁRIA

Token da API Asaas foi detectado exposto no repositório (commit 916a8f33).

## 🛡️ O que foi feito

### Tokens removidos dos seguintes arquivos:
1. ✅ `docs/PIX_SETUP.md` (linhas 121 e 125)
2. ✅ `SETUP_INTEGRAÇÕES.md` (linha 166)
3. ✅ `.env` (linha 95 - comentado)
4. ✅ `apps/web/.env.local` (linha 95 - comentado)
5. ✅ `ENV_SETUP.md` (JWT_SECRET de exemplo)
6. ✅ `QUICKSTART.md` (JWT_SECRET de exemplo)
7. ✅ `DEPLOYMENT.md` (DATABASE_URL de exemplo melhorado)

### Tokens substituídos por:
- `$aact_xxxxxxx...` (Asaas)
- `$aact_sua_chave_api_aqui` (Asaas)
- `gere_sua_chave_com_openssl_rand_hex_32` (JWT)
- `[YOUR_PASSWORD]` (Database URLs)

## 🚨 AÇÕES OBRIGATÓRIAS

### 1. Revogar token Asaas comprometido IMEDIATAMENTE

**Token exposto:**
```
$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwODc0Mzc6OiRhYWNoXzFiZDA3OGE3LWZlNWUtNDRiOS05YTFjLWI5MTgwOWU4NjFlMA==
```

**Como revogar:**
1. Acesse [Asaas Dashboard](https://www.asaas.com) (ou [Sandbox](https://sandbox.asaas.com/))
2. Vá em **Integrações** → **Chaves de API**
3. Localize a chave exposta
4. Clique em **Revogar** ou **Deletar**
5. Gere uma **nova chave de API**
6. Atualize sua variável de ambiente `ASAAS_API_KEY` com a nova chave

### 2. Gerar novo JWT_SECRET

```bash
openssl rand -hex 32
```

### 3. Limpar histórico do Git (CRÍTICO)

Os tokens ainda existem no histórico do Git. Para removê-los completamente:

**Opção A: BFG Repo-Cleaner (Recomendado)**
```bash
# Instalar BFG
brew install bfg  # macOS
# ou baixe de: https://rtyley.github.io/bfg-repo-cleaner/

# Remover tokens do histórico
bfg --replace-text passwords.txt

# passwords.txt deve conter:
# $aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwODc0Mzc6OiRhYWNoXzFiZDA3OGE3LWZlNWUtNDRiOS05YTFjLWI5MTgwOWU4NjFlMA==
# 6dc88b6683cdb6f5abb07a661a631114eec66738accd953756fe004a3965a8be

# Forçar limpeza
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Forçar push (CUIDADO: reescreve histórico)
git push --force
```

**Opção B: git filter-branch**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docs/PIX_SETUP.md SETUP_INTEGRAÇÕES.md .env apps/web/.env.local" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
git push origin --force --tags
```

### 4. Avisar todos os membros da equipe

Notifique todos os desenvolvedores sobre:
- Token Asaas comprometido e revogado
- Necessidade de atualizar `.env` local com novo token
- Necessidade de fazer pull com `--rebase` após limpeza do histórico

### 5. Verificar logs da Asaas

1. Acesse **Dashboard Asaas** → **Logs de API**
2. Verifique se houve uso não autorizado do token
3. Revise todas as transações recentes
4. Se detectar atividade suspeita, contate o suporte Asaas imediatamente

### 6. Implementar prevenção

Adicionar ao `.gitignore` (já está, mas verifique):
```
.env
.env.local
.env.*.local
*.secret
*.key
secrets/
```

Instalar ferramentas de detecção:
```bash
# Instalar git-secrets
brew install git-secrets

# Configurar para este repo
git secrets --install
git secrets --register-aws
git secrets --add '$aact_[A-Za-z0-9+/=]{50,}'
git secrets --add 'ASAAS_API_KEY=.*'
```

## 📋 Checklist de Segurança

- [ ] Token Asaas revogado
- [ ] Nova chave Asaas gerada
- [ ] Variável `ASAAS_API_KEY` atualizada em produção (Vercel/servidor)
- [ ] Variável `ASAAS_API_KEY` atualizada localmente (`.env.local`)
- [ ] Novo `JWT_SECRET` gerado
- [ ] Variável `JWT_SECRET` atualizada em produção
- [ ] Histórico do Git limpo com BFG ou filter-branch
- [ ] Force push realizado
- [ ] Equipe notificada
- [ ] Logs da Asaas verificados
- [ ] git-secrets instalado e configurado
- [ ] Documentação revisada (este commit)

## 🔐 Boas Práticas Futuras

1. **NUNCA** commite tokens, senhas ou chaves de API
2. Use sempre variáveis de ambiente via `.env.local` (não commitado)
3. Use `.env.example` com placeholders para documentação
4. Configure git hooks para prevenir commits de secrets
5. Use ferramentas como `git-secrets` ou `trufflehog`
6. Revise PRs cuidadosamente antes de merge
7. Faça rotação regular de chaves de API (a cada 90 dias)
8. Use diferentes chaves para desenvolvimento, staging e produção

## 📞 Suporte

- **Asaas:** suporte@asaas.com.br
- **Dúvidas de segurança:** Contate o líder técnico do projeto

---

**Data da correção:** 2026-02-17  
**Commit:** Próximo após este documento  
**Gravidade:** CRÍTICA 🔴
