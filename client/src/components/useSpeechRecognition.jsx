import { useState, useEffect } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export const useSpeechRecognition = (speechLanguage, tts_voice, speechText, setSpeechText, setListening) => {
	let speechConfig = sdk.SpeechConfig.fromSubscription('BKcGwBuh2Ix5W2ob8GvkWTK67cAXfnt4Rf5rh6l2orum6fMDCV2pJQQJ99ALACYeBjFXJ3w3AAAYACOG6Bz3', 'eastus');

	speechConfig.speechSynthesisVoiceName = tts_voice;
	speechConfig.speechRecognitionLanguage = speechLanguage;

	let speechAudioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
	let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, speechAudioConfig);

	const updateSpeechConfig = (newSpeechLanguage, newTtsVoice) => {
		speechConfig.speechSynthesisVoiceName = newTtsVoice;
		speechConfig.speechRecognitionLanguage = newSpeechLanguage;
		speechRecognizer.close();
		speechRecognizer = new sdk.SpeechRecognizer(speechConfig, speechAudioConfig);
	};

	const startListening = () => {
		setListening(true);
		speechRecognizer = new sdk.SpeechRecognizer(speechConfig, speechAudioConfig);

		speechRecognizer.recognizeOnceAsync((result) => {
			speechRecognizer.recognizing = (_, event) => {
				setSpeechText(event.result.text);
			};

			if (result.reason === ResultReason.RecognizedSpeech) {
				setSpeechText(result.text);
				setListening(false);
			}
		});
	};

	const stopListening = () => {
		speechRecognizer.recognizing = null;
		speechRecognizer.close();
		setListening(false);
	};

	return {
		startListening,
		stopListening,
		updateSpeechConfig
	};
};
