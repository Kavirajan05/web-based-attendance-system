// Face comparison service
class FaceComparisonService {
  
  // Simple face comparison using canvas pixel analysis
  static async compareFaces(capturedImageData, storedImageUrl) {
    try {
      console.log('🔍 Starting face comparison...');
      
      // Load both images
      const capturedCanvas = await this.loadImageToCanvas(capturedImageData);
      const storedCanvas = await this.loadImageFromUrl(storedImageUrl);
      
      if (!capturedCanvas || !storedCanvas) {
        return { similarity: 0, confidence: 0, match: false };
      }
      
      // Extract face features
      const capturedFeatures = this.extractFaceFeatures(capturedCanvas);
      const storedFeatures = this.extractFaceFeatures(storedCanvas);
      
      // Calculate similarity
      const similarity = this.calculateSimilarity(capturedFeatures, storedFeatures);
      const confidence = Math.round(similarity * 100);
      const match = similarity > 0.65; // 65% threshold for match
      
      console.log(`📊 Face comparison result: ${confidence}% similarity, Match: ${match}`);
      
      return {
        similarity: similarity,
        confidence: confidence,
        match: match,
        threshold: 65
      };
      
    } catch (error) {
      console.error('❌ Face comparison error:', error);
      return { similarity: 0, confidence: 0, match: false, error: error.message };
    }
  }
  
  static async loadImageToCanvas(imageData) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = 200; // Standardize size
          canvas.height = 200;
          ctx.drawImage(img, 0, 0, 200, 200);
          resolve(canvas);
        };
        
        img.onerror = () => resolve(null);
        img.src = imageData;
      } catch (error) {
        resolve(null);
      }
    });
  }
  
  static async loadImageFromUrl(imageUrl) {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = 200;
          canvas.height = 200;
          ctx.drawImage(img, 0, 0, 200, 200);
          resolve(canvas);
        };
        
        img.onerror = () => resolve(null);
        img.crossOrigin = 'anonymous';
        img.src = `http://localhost:5000${imageUrl}`;
      } catch (error) {
        resolve(null);
      }
    });
  }
  
  static extractFaceFeatures(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Extract simple features
    const features = {
      brightness: 0,
      contrast: 0,
      redAvg: 0,
      greenAvg: 0,
      blueAvg: 0,
      centerRegion: [],
      edgeRegion: []
    };
    
    let totalPixels = 0;
    let redSum = 0, greenSum = 0, blueSum = 0;
    
    // Analyze pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      redSum += r;
      greenSum += g;
      blueSum += b;
      totalPixels++;
      
      const pixelIndex = i / 4;
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);
      
      // Classify pixels into regions
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      
      if (distance < canvas.width * 0.3) {
        features.centerRegion.push(r + g + b);
      } else if (distance > canvas.width * 0.4) {
        features.edgeRegion.push(r + g + b);
      }
    }
    
    features.redAvg = redSum / totalPixels;
    features.greenAvg = greenSum / totalPixels;
    features.blueAvg = blueSum / totalPixels;
    features.brightness = (features.redAvg + features.greenAvg + features.blueAvg) / 3;
    
    // Calculate averages for regions
    features.centerAvg = features.centerRegion.reduce((a, b) => a + b, 0) / features.centerRegion.length || 0;
    features.edgeAvg = features.edgeRegion.reduce((a, b) => a + b, 0) / features.edgeRegion.length || 0;
    
    return features;
  }
  
  static calculateSimilarity(features1, features2) {
    // Calculate similarity based on multiple features
    const similarities = [];
    
    // Color similarity
    const colorSim = 1 - (
      Math.abs(features1.redAvg - features2.redAvg) +
      Math.abs(features1.greenAvg - features2.greenAvg) +
      Math.abs(features1.blueAvg - features2.blueAvg)
    ) / (255 * 3);
    similarities.push(colorSim);
    
    // Brightness similarity
    const brightnessSim = 1 - Math.abs(features1.brightness - features2.brightness) / 255;
    similarities.push(brightnessSim);
    
    // Center region similarity
    const centerSim = 1 - Math.abs(features1.centerAvg - features2.centerAvg) / 765;
    similarities.push(centerSim);
    
    // Edge region similarity
    const edgeSim = 1 - Math.abs(features1.edgeAvg - features2.edgeAvg) / 765;
    similarities.push(edgeSim);
    
    // Weighted average (center region more important)
    const weights = [0.3, 0.2, 0.4, 0.1];
    let weightedSum = 0;
    
    for (let i = 0; i < similarities.length; i++) {
      weightedSum += similarities[i] * weights[i];
    }
    
    return Math.max(0, Math.min(1, weightedSum));
  }
  
  // Advanced comparison using histogram analysis
  static calculateHistogramSimilarity(canvas1, canvas2) {
    const hist1 = this.calculateHistogram(canvas1);
    const hist2 = this.calculateHistogram(canvas2);
    
    // Calculate correlation coefficient
    let correlation = 0;
    for (let i = 0; i < 256; i++) {
      correlation += Math.min(hist1[i], hist2[i]);
    }
    
    return correlation;
  }
  
  static calculateHistogram(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const histogram = new Array(256).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      histogram[gray]++;
    }
    
    // Normalize
    const totalPixels = canvas.width * canvas.height;
    return histogram.map(count => count / totalPixels);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FaceComparisonService;
}