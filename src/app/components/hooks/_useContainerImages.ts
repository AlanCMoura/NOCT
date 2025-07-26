// src/hooks/useContainerImages.ts
import { useState, useEffect } from 'react';

interface UseContainerImagesProps {
  containerId: string;
  imageFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

interface UseContainerImagesReturn {
  presignedUrls: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useContainerImages = ({ 
  containerId, 
  imageFetch 
}: UseContainerImagesProps): UseContainerImagesReturn => {
  const [presignedUrls, setPresignedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const baseUrl = 'http://containerview-prod.us-east-1.elasticbeanstalk.com';
  
  const fetchImages = async () => {
    if (!containerId) {
      setError('Container ID não fornecido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📸 Buscando URLs presigned para container: ${containerId}`);
      console.log(`🔐 Usando requisição autenticada (imageFetch com token)`);
      
      // Esta requisição USA AUTENTICAÇÃO via imageFetch
      const response = await imageFetch(`${baseUrl}/containers/${containerId}/imagens`);
      
      console.log(`📥 Resposta do endpoint autenticado:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type'),
          authorization: response.headers.get('authorization') ? 'PRESENTE' : 'AUSENTE'
        }
      });
      
      if (response.ok) {
        const urls: string[] = await response.json();
        console.log(`✅ ${urls.length} URLs presigned obtidas para container ${containerId}`);
        console.log('📋 URLs presigned (S3 - não precisam auth):', urls.map(url => {
          // Verifica se é URL do S3
          const isS3Url = url.includes('amazonaws.com') || url.includes('s3');
          const hasSignature = url.includes('Signature=') || url.includes('X-Amz-');
          return `${url.substring(0, 100)}... (S3: ${isS3Url}, Signed: ${hasSignature})`;
        }));
        
        setPresignedUrls(urls);
      } else {
        const errorMsg = `Erro ao buscar imagens: ${response.status} ${response.statusText}`;
        console.error(`❌ Requisição autenticada falhou: ${errorMsg}`);
        
        // Log adicional para debug de autenticação
        if (response.status === 401) {
          console.error(`🔒 Erro 401: Token expirado ou inválido`);
        } else if (response.status === 403) {
          console.error(`🚫 Erro 403: Sem permissão para acessar este container`);
        }
        
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error(`❌ Erro na requisição autenticada:`, err);
      
      // Verifica se é erro de sessão expirada
      if (errorMsg.includes('Sessão expirada')) {
        console.error(`🔒 Sessão expirada detectada no hook`);
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (containerId) {
      fetchImages();
    }
  }, [containerId]);
  
  return {
    presignedUrls,
    loading,
    error,
    refetch: fetchImages
  };
};

export default function() { return null; }
