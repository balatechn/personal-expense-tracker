import { useState, useCallback, useRef } from 'react';

export function useVoice(onResult) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onResult(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);

    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { listening, start, stop, supported };
}

// Parse spoken text like "spent 250 rupees on food"
export function parseVoiceInput(text) {
  const lower = text.toLowerCase();

  // Extract amount
  const amountMatch = lower.match(/(\d+[\d,.]*)/);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

  // Extract category hint
  const categoryKeywords = {
    food: ['food', 'eat', 'lunch', 'dinner', 'breakfast', 'snack', 'restaurant', 'zomato', 'swiggy'],
    transport: ['transport', 'petrol', 'diesel', 'fuel', 'uber', 'ola', 'cab', 'bus', 'train', 'auto', 'metro'],
    groceries: ['grocery', 'groceries', 'vegetables', 'fruits', 'milk'],
    bills: ['bill', 'electricity', 'water', 'rent', 'emi', 'recharge', 'internet', 'phone'],
    shopping: ['shopping', 'amazon', 'flipkart', 'clothes', 'shoes'],
    entertainment: ['movie', 'netflix', 'game', 'party', 'concert'],
    health: ['medicine', 'doctor', 'hospital', 'gym', 'pharmacy', 'health'],
    education: ['book', 'course', 'school', 'study', 'class', 'tuition'],
  };

  let category = null;
  for (const [cat, kws] of Object.entries(categoryKeywords)) {
    if (kws.some(kw => lower.includes(kw))) {
      category = cat.charAt(0).toUpperCase() + cat.slice(1);
      break;
    }
  }

  // The rest of the text minus amount/category words becomes a note
  let note = text;
  if (amountMatch) note = note.replace(amountMatch[0], '');
  note = note.replace(/spent|rupees?|rs\.?|on|for|₹/gi, '').trim();
  if (note.length < 2) note = '';

  return { amount, category, note };
}
