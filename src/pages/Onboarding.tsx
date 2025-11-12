import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { registerUser, createSession } from '../lib/auth';
import { detectProvider } from '../lib/crypto';
import { testApiKey } from '../lib/llm';

type Step = 'welcome' | 'name' | 'apikey' | 'complete';

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'ollama'>('anthropic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameSubmit = () => {
    if (name.trim()) {
      setStep('apikey');
    }
  };

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const detectedProvider = detectProvider(apiKey);
      
      // Test API key
      const isValid = await testApiKey(apiKey, detectedProvider);
      
      if (!isValid) {
        setError('Chave API inválida. Verifique e tente novamente.');
        setLoading(false);
        return;
      }
      
      // Register user
      await registerUser(name, apiKey);
      
      // Create session (simplified - we'll improve this later)
      const userId = `user-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.random().toString(36).substring(2, 5)}`;
      await createSession(userId);
      
      setStep('complete');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Erro ao configurar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        {step === 'welcome' && (
          <>
            <CardHeader>
              <CardTitle className="text-3xl text-center">
                ✨ Bem-vindo ao minicontratos
              </CardTitle>
              <CardDescription className="text-center text-lg">
                Contratos em português que executam sozinhos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">🎯 O que você pode fazer:</h3>
                <ul className="space-y-2 text-sm">
                  <li>✅ Criar contratos em português natural</li>
                  <li>✅ Assinatura digital criptográfica</li>
                  <li>✅ Prova matemática de autenticidade</li>
                  <li>✅ Execução automática de regras</li>
                  <li>✅ 100% no seu dispositivo, 100% privado</li>
                </ul>
              </div>
              <Button onClick={() => setStep('name')} className="w-full" size="lg">
                Começar 🚀
              </Button>
            </CardContent>
          </>
        )}
        
        {step === 'name' && (
          <>
            <CardHeader>
              <CardTitle>Oi! Como você se chama?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Seu nome..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                />
              </div>
              <Button 
                onClick={handleNameSubmit} 
                disabled={!name.trim()}
                className="w-full"
              >
                Continuar →
              </Button>
            </CardContent>
          </>
        )}
        
        {step === 'apikey' && (
          <>
            <CardHeader>
              <CardTitle>Legal, {name}! 👋</CardTitle>
              <CardDescription>
                Para funcionar, preciso que você cole uma chave de API de algum provedor LLM.
                <br /><br />
                <strong>Não se preocupe</strong>: sua chave fica 100% no seu dispositivo,
                nunca enviamos para nossos servidores!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Escolha um provedor:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={provider === 'anthropic' ? 'default' : 'outline'}
                    onClick={() => setProvider('anthropic')}
                    size="sm"
                  >
                    Anthropic
                  </Button>
                  <Button
                    variant={provider === 'openai' ? 'default' : 'outline'}
                    onClick={() => setProvider('openai')}
                    size="sm"
                  >
                    OpenAI
                  </Button>
                  <Button
                    variant={provider === 'ollama' ? 'default' : 'outline'}
                    onClick={() => setProvider('ollama')}
                    size="sm"
                  >
                    Ollama
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {provider === 'anthropic' && (
                  <>
                    <p className="text-sm text-gray-600">
                      Recomendado! Claude é excelente para contratos.
                    </p>
                    <Input
                      type="password"
                      placeholder="sk-ant-api03-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <a 
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      Não tem uma chave? Crie grátis (5 min) →
                    </a>
                  </>
                )}
                
                {provider === 'openai' && (
                  <>
                    <p className="text-sm text-gray-600">
                      GPT-4 também funciona bem!
                    </p>
                    <Input
                      type="password"
                      placeholder="sk-proj-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <a 
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      Criar chave OpenAI →
                    </a>
                  </>
                )}
                
                {provider === 'ollama' && (
                  <>
                    <p className="text-sm text-gray-600">
                      Para rodar modelos localmente (grátis!)
                    </p>
                    <Input
                      placeholder="http://localhost:11434"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <a 
                      href="https://ollama.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block"
                    >
                      Instalar Ollama →
                    </a>
                  </>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <Button 
                onClick={handleApiKeySubmit}
                disabled={!apiKey.trim() || loading}
                className="w-full"
              >
                {loading ? 'Validando...' : 'Validar e Continuar →'}
              </Button>
            </CardContent>
          </>
        )}
        
        {step === 'complete' && (
          <>
            <CardHeader>
              <CardTitle className="text-center">🎉 Tudo pronto!</CardTitle>
              <CardDescription className="text-center">
                Sua conta foi criada com sucesso. Redirecionando...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};
