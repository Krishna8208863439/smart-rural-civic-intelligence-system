import i18n from '../i18n/i18n';

// Comprehensive dictionary for civic terms, issues, descriptions, landmarks, causes, and recommendations
const DICTIONARY = {
  // Categories
  'Waste accumulation': {
    mr: 'कचरा साचणे',
    hi: 'कचरा जमा होना',
  },
  'Drainage blockage': {
    mr: 'सांडपाणी नाला तुंबणे',
    hi: 'नाली / ड्रेनेज अवरोध',
  },
  'Water leakage': {
    mr: 'पाणी गळती / पाईप फुटणे',
    hi: 'जल रिसाव / पाइप फटना',
  },
  'Damaged road': {
    mr: 'रस्त्यावरील खड्डे व नुकसान',
    hi: 'क्षतिग्रस्त सड़क एवं गड्ढे',
  },
  'Streetlight failure': {
    mr: 'पथदिवा (स्ट्रीटलाईट) बंद',
    hi: 'स्ट्रीट लाइट बंद होना',
  },
  'Water supply': {
    mr: 'पिण्याचे पाणी पुरवठा',
    hi: 'पेयजल आपूर्ति समस्या',
  },
  'Sanitation': {
    mr: 'सार्वजनिक स्वच्छता व शौचालय',
    hi: 'सार्वजनिक स्वच्छता एवं शौचालय',
  },
  'Other': {
    mr: 'इतर नागरी समस्या',
    hi: 'अन्य नागरिक समस्या',
  },

  // Statuses
  'NEW': {
    mr: 'नवीन तक्रार',
    hi: 'नई समस्या',
  },
  'VALIDATED': {
    mr: 'वैधता तपासली',
    hi: 'सत्यापित',
  },
  'ASSIGNED': {
    mr: 'कर्मचारी नियुक्त',
    hi: 'सौंपा गया',
  },
  'UNDER ACTION': {
    mr: 'काम चालू आहे',
    hi: 'कार्य प्रगति पर',
  },
  'ACTION COMPLETED': {
    mr: 'काम पूर्ण झाले',
    hi: 'कार्य पूर्ण',
  },
  'MONITORING': {
    mr: 'निरीक्षण चालू',
    hi: 'निगरानी',
  },
  'VERIFIED RESOLVED': {
    mr: 'निवारण प्रमाणित',
    hi: 'समाधान सत्यापित',
  },
  'REOPENED': {
    mr: 'पुन्हा उघडले',
    hi: 'पुनः खोला गया',
  },

  // Priority & Severity
  'Critical': {
    mr: 'अतितातडीचे / गंभीर',
    hi: 'अत्यंत गंभीर / तत्काल',
  },
  'High': {
    mr: 'उच्च प्राधान्य',
    hi: 'उच्च प्राथमिकता',
  },
  'Medium': {
    mr: 'मध्यम प्राधान्य',
    hi: 'मध्यम प्राथमिकता',
  },
  'Low': {
    mr: 'कमी प्राधान्य',
    hi: 'निम्न प्राथमिकता',
  },

  // Reliability Levels
  'Very High': {
    mr: 'अति उच्च विश्वासार्हता',
    hi: 'अति उच्च विश्वसनीयता',
  },
  'Fragile': {
    mr: 'अस्थिर',
    hi: 'नाजुक / अस्थिर',
  },
  'Unstable': {
    mr: 'अतिशय अस्थिर',
    hi: 'अस्थिर',
  },
  'Moderate': {
    mr: 'मध्यम स्थिर',
    hi: 'मध्यम स्थिर',
  },
  'Stable': {
    mr: 'स्थिर',
    hi: 'स्थिर',
  },

  // Months & Chart labels
  'Jul 25': { mr: 'जुलै २५', hi: 'जुलाई २५' },
  'Aug 25': { mr: 'ऑगस्ट २५', hi: 'अगस्त २५' },
  'Sep 25': { mr: 'सप्टेंबर २५', hi: 'सितंबर २५' },
  'Oct 25': { mr: 'ऑक्टोबर २५', hi: 'अक्टूबर २५' },
  'Nov 25': { mr: 'नोव्हेंबर २५', hi: 'नवंबर २५' },
  'Dec 25': { mr: 'डिसेंबर २५', hi: 'दिसंबर २५' },
  'Reported': { mr: 'नोंदवलेल्या', hi: 'दर्ज' },
  'Resolved': { mr: 'सोडवलेल्या', hi: 'समाधान' },
  'High Recurrence': { mr: 'उच्च पुनरावृत्ती', hi: 'उच्च पुनरावृत्ति' },
  'Medium Recurrence': { mr: 'मध्यम पुनरावृत्ती', hi: 'मध्यम पुनरावृत्ति' },
  'Low Recurrence': { mr: 'कमी पुनरावृत्ती', hi: 'कम पुनरावृत्ति' },

  // Adaptive Paths
  'auto_validated': {
    mr: 'जलद स्वयंचलित पडताळणी',
    hi: 'फास्ट-ट्रैक स्वचालित सत्यापन',
  },
  'community_confirmation': {
    mr: 'नागरिक पुष्टी आवश्यक',
    hi: 'सामुदायिक पुष्टि आवश्यक',
  },
  'manual_review': {
    mr: 'प्रशासन प्रत्यक्ष तपासणी आवश्यक',
    hi: 'प्रशासन प्रत्यक्ष समीक्षा आवश्यक',
  },

  // Common Hotspots
  'Weekly Bazaar Ground & Main Chowk': {
    mr: 'आठवडे बाजार मैदान व मुख्य चौक',
    hi: 'साप्ताहिक बाजार मैदान एवं मुख्य चौक',
  },
  'Zilla Parishad Primary School Culvert': {
    mr: 'जि.प. प्राथमिक शाळा सांडपाणी मोरी',
    hi: 'जिला परिषद प्राथमिक विद्यालय पुलिया',
  },
  'Water Tank Hill Road & Pipeline Ridge': {
    mr: 'पाणी टाकी टेकडी रस्ता व पाईपलाईन',
    hi: 'पानी की टंकी पहाड़ी मार्ग एवं पाइपलाइन',
  },
  'Main Market Road Pothole Cluster': {
    mr: 'मुख्य बाजार रस्ता खड्डे पट्टा',
    hi: 'मुख्य बाजार सड़क गड्ढा क्षेत्र',
  },
  'Gram Panchayat Office Approach Feeder': {
    mr: 'ग्रामपंचायत कार्यालय प्रवेश मार्ग',
    hi: 'ग्राम पंचायत कार्यालय पहुंच मार्ग',
  },

  // Common Causes
  'Sub-optimal waste collection vehicle frequency on weekly market days': {
    mr: 'आठवडे बाजाराच्या दिवशी कचरा गोळा करणाऱ्या गाडीची अपुरी वारंवारता',
    hi: 'साप्ताहिक बाजार के दिनों में कचरा संग्रह वाहन की अपर्याप्त आवृत्ति',
  },
  'Lack of segregated wet/dry collection points near vegetable stalls': {
    mr: 'भाजी मंडई जवळ ओला व सुका कचरा वेगळा करण्याची व्यवस्था नसणे',
    hi: 'सब्जी मंडी के पास गीले और सूखे कचरे के पृथक्करण बिंदुओं का अभाव',
  },
  'Inadequate stormwater culvert cross-section capacity during monsoon runoff': {
    mr: 'पावसाळ्यात पाण्याचा निचरा होण्यासाठी मोरीचा आकार अपुरा असणे',
    hi: 'मानसून के दौरान जल निकासी के लिए पुलिया की अपर्याप्त क्षमता',
  },
  'Hydraulic pressure surge (water hammer) on aged PVC pipeline joints': {
    mr: 'जुन्या पीव्हीसी पाईप जोडणीवर पाण्याचा अचानक दाब वाढणे',
    hi: 'पुराने पीवीसी पाइप जोड़ों पर अचानक हाइड्रोलिक दबाव बढ़ना',
  },
  'Heavy commercial vehicle overload on rural single-lane subgrade': {
    mr: 'ग्रामीण एकेरी रस्त्यावर अवजड व्यावसायिक वाहनांची ओव्हरलोड वाहतूक',
    hi: 'ग्रामीण एकल-लेन सड़क पर भारी वाणिज्यिक वाहनों का अत्यधिक भार',
  },
  'Voltage fluctuations causing rapid driver burnout in unshielded fixtures': {
    mr: 'विजेच्या चढ-उतारामुळे पथदिव्यांचे ड्रायव्हर वारंवार जळणे',
    hi: 'वोल्टेज के उतार-चढ़ाव के कारण स्ट्रीट लाइट ड्राइवर का बार-बार खराब होना',
  },

  // Common Preventive Actions
  'Install twin 240L heavy-duty masonry bins and schedule special Sunday morning vehicle clearing': {
    mr: 'दोन २४० लिटरचे पक्के कचरा कुंड बसवणे आणि रविवारी सकाळी विशेष कचरा गाडी पाठवणे',
    hi: 'दोहरे 240L पक्के कचरा डिब्बे स्थापित करना और रविवार सुबह विशेष वाहन द्वारा सफाई करना',
  },
  'Pre-monsoon mechanical desilting and installation of galvanized trash barrier': {
    mr: 'पावसाळ्यापूर्वी मोरीतील गाळ काढणे व कचरा अडवण्यासाठी जाळी बसवणे',
    hi: 'मानसून पूर्व गाद निकालना और कचरा रोकने के लिए गैल्वेनाइज्ड जाली लगाना',
  },
  'Install automatic pressure-relief air release valve at junction high-point': {
    mr: 'पाईपलाईनच्या उंचावरील जोडणीवर स्वयंचलित प्रेशर व्हॉल्व्ह बसवणे',
    hi: 'पाइपलाइन के ऊंचे जंक्शन पर स्वचालित प्रेशर रिलीफ वाल्व लगाना',
  },
  'Bituminous cold-mix overlay with 150mm crushed-aggregate base reinforcement': {
    mr: 'डांबरीकरण व १५० मिमी खडीचा पाया मजबूत करणे',
    hi: 'बिटुमिनस कोल्ड-मिक्स डामरीकरण और 150 मिमी आधार सुदृढ़ीकरण',
  },
  'Install surge protection units (SPD) and industrial IP66 weatherproof LED fixtures': {
    mr: 'व्होल्टेज सर्च प्रोटेक्शन (SPD) व उच्च दर्जाचे आयपी६६ वॉटरप्रूफ एलईडी दिवे बसवणे',
    hi: 'सर्ज प्रोटेक्शन यूनिट (SPD) और वाटरप्रूफ IP66 एलईडी लाइटें स्थापित करना',
  },

  // Seed Issue Titles & Variations
  'Streetlight not working': {
    mr: 'पथदिवा (स्ट्रीटलाईट) बंद असणे',
    hi: 'स्ट्रीट लाइट बंद होना',
  },
  'Street light not working': {
    mr: 'पथदिवा बंद असणे',
    hi: 'स्ट्रीट लाइट बंद होना',
  },
  'Streetlight failure': {
    mr: 'पथदिवा (स्ट्रीटलाईट) बंद',
    hi: 'स्ट्रीट लाइट बंद होना',
  },
  'Street lights not working': {
    mr: 'पथदिवे बंद आहेत',
    hi: 'स्ट्रीट लाइटें बंद हैं',
  },
  'Major drinking water pipe leak flooding road': {
    mr: 'पिण्याच्या पाण्याची पाईपलाईन फुटल्याने रस्ता जलमय झाला आहे',
    hi: 'मुख्य पेयजल पाइपलाइन फटने से सड़क जलमग्न हो गई है',
  },
  'Water pipe leak': {
    mr: 'पाण्याची पाईपलाईन गळती',
    hi: 'पेयजल पाइपलाइन रिसाव / लीकेज',
  },
  'Water leakage': {
    mr: 'पाणी गळती / पाईप फुटणे',
    hi: 'जल रिसाव / पाइप फटना',
  },
  'Overflowing garbage dump near primary school': {
    mr: 'प्राथमिक शाळेजवळ कचऱ्याचे ढीग साचले आहेत',
    hi: 'प्राथमिक विद्यालय के पास कचरे का ढेर जमा हो गया है',
  },
  'Garbage overflow': {
    mr: 'कचऱ्याचे ढीग साचणे',
    hi: 'कचरे का ढेर जमा होना',
  },
  'Waste accumulation': {
    mr: 'कचरा साचणे',
    hi: 'कचरा जमा होना',
  },
  'Deep potholes and road damage on main market road': {
    mr: 'मुख्य बाजार रस्त्यावर खोल खड्डे आणि रस्त्याचे मोठे नुकसान',
    hi: 'मुख्य बाजार सड़क पर गहरे गड्ढे और सड़क की गंभीर क्षति',
  },
  'Potholes on road': {
    mr: 'रस्त्यावरील खड्डे व नुकसान',
    hi: 'सड़क पर गड्ढे एवं क्षति',
  },
  'Damaged road': {
    mr: 'रस्त्यावरील खड्डे व नुकसान',
    hi: 'क्षतिग्रस्त सड़क एवं गड्ढे',
  },
  'Drainage choke causing foul water logging in lane': {
    mr: 'गल्लीतील सांडपाणी नाला तुंबल्याने घाण पाणी साचले आहे',
    hi: 'गली में नाली चोक होने से गंदा पानी भर गया है',
  },
  'Drainage blockage': {
    mr: 'सांडपाणी नाला तुंबणे',
    hi: 'नाली / ड्रेनेज अवरोध',
  },
  'Streetlights not working on village approach road': {
    mr: 'गावाच्या प्रवेश रस्त्यावरील पथदिवे बंद आहेत',
    hi: 'गांव के पहुंच मार्ग पर स्ट्रीट लाइटें बंद हैं',
  },
  'Community water tap broken and wasting water': {
    mr: 'सार्वजनिक पिण्याच्या पाण्याचा नळ तुटला असून पाण्याची नासाडी होत आहे',
    hi: 'सार्वजनिक पेयजल नल टूट गया है और पानी व्यर्थ बह रहा है',
  },
  'Community water tank disruption': {
    mr: 'सामुदायिक पाण्याच्या टाकीत बिघाड',
    hi: 'सामुदायिक पानी की टंकी बाधित',
  },
  'Public toilet overflow': {
    mr: 'सार्वजनिक शौचालय तुंबणे व अस्वच्छता',
    hi: 'सार्वजनिक शौचालय में गंदगी एवं ओवरफ्लो',
  },
  'Open manhole hazard near bus stop': {
    mr: 'बस स्थानकाजवळ उघडे मॅनहोल अपघातास कारणीभूत ठरू शकते',
    hi: 'बस स्टॉप के पास खुला मैनहोल दुर्घटना का कारण बन सकता है',
  },
  'Waste accumulation near Weekly Bazaar Ground': {
    mr: 'आठवडे बाजार मैदानाजवळ प्रचंड कचरा साचला आहे',
    hi: 'साप्ताहिक बाजार मैदान के पास भारी कचरा जमा हुआ है',
  },
  'Severe drainage blockage near ZP School Culvert': {
    mr: 'जि.प. शाळा मोरीजवळ सांडपाणी नाला पूर्णपणे तुंबला आहे',
    hi: 'जिला परिषद स्कूल पुलिया के पास गंभीर नाली अवरोध',
  },
  'Water leakage near Water Tank Hill Road': {
    mr: 'पाणी टाकी टेकडी रस्त्यावर पाईपलाईनमधून पाण्याची मोठी गळती',
    hi: 'पानी की टंकी पहाड़ी मार्ग पर पाइपलाइन से भारी जल रिसाव',
  },
  'Pothole cluster on Main Market Road': {
    mr: 'मुख्य बाजार रस्त्यावर खड्ड्यांचे साम्राज्य पसरले आहे',
    hi: 'मुख्य बाजार सड़क पर गड्ढों का अंबार लगा हुआ है',
  },
  'Frequent feeder streetlight tripping near GP Office': {
    mr: 'ग्रामपंचायत कार्यालयाजवळील पथदिवे वारंवार बंद पडत आहेत',
    hi: 'ग्राम पंचायत कार्यालय के पास स्ट्रीट लाइटें बार-बार बंद हो रही हैं',
  },

  // Operational Texts & Notes
  'Repairs completed to standard.': {
    mr: 'दर्जेदार मानकांनुसार दुरुस्ती काम पूर्ण झाले.',
    hi: 'मानकों के अनुसार मरम्मत कार्य पूर्ण किया गया।',
  },
  'Work initiated on site': {
    mr: 'घटनास्थळी कामाला सुरुवात झाली',
    hi: 'कार्यस्थल पर कार्य शुरू हुआ',
  },
  'Field inspection conducted': {
    mr: 'घटनास्थळी प्रत्यक्ष पाहणी पूर्ण केली',
    hi: 'क्षेत्रीय निरीक्षण संपन्न हुआ',
  },
  'Proof photo uploaded': {
    mr: 'निवारणाचा फोटो पुरावा अपलोड केला',
    hi: 'समाधान फोटो प्रमाण अपलोड किया गया',
  },
  'Inspected and approved': {
    mr: 'तपासणी करून मंजूर केले',
    hi: 'निरीक्षण किया गया एवं स्वीकृत',
  },
  'Awaiting worker assignment': {
    mr: 'कर्मचारी नियुक्तीची प्रतीक्षा',
    hi: 'कार्यकर्ता आवंटन की प्रतीक्षा',
  },
  'Worker on-site repairs': {
    mr: 'घटनास्थळी दुरुस्ती काम',
    hi: 'कार्यस्थल पर मरम्मत कार्य',
  },
  'Admin quality check': {
    mr: 'प्रशासकीय दर्जा तपासणी',
    hi: 'प्रशासनिक गुणवत्ता निरीक्षण',
  },
  'Citizen rating & review': {
    mr: 'नागरिक समाधान रेटिंग व आढावा',
    hi: 'नागरिक संतुष्टि रेटिंग एवं समीक्षा',
  },
  'Multi-factor weighted calculation': {
    mr: 'अनेक घटकांवर आधारित भारित गणना',
    hi: 'बहु-घटक भारित गणना',
  },
  'Cluster recurrence evaluation': {
    mr: 'वारंवारता क्लस्टर मूल्यांकन',
    hi: 'क्लस्टर पुनरावृत्ति मूल्यांकन',
  },

  // Landmarks & Addresses
  'Near Zilla Parishad Primary School': {
    mr: 'जि.प. प्राथमिक शाळेजवळ',
    hi: 'जिला परिषद प्राथमिक विद्यालय के पास',
  },
  'Opposite Gram Panchayat Office': {
    mr: 'ग्रामपंचायत कार्यालयासमोर',
    hi: 'ग्राम पंचायत कार्यालय के सामने',
  },
  'Weekly Bazaar Ground': {
    mr: 'आठवडे बाजार मैदान',
    hi: 'साप्ताहिक बाजार मैदान',
  },
  'Water Tank Hill Road': {
    mr: 'पाण्याच्या टाकीचा टेकडी रस्ता',
    hi: 'पानी की टंकी पहाड़ी मार्ग',
  },
  'Main Market Chowk': {
    mr: 'मुख्य बाजार चौक',
    hi: 'मुख्य बाजार चौक',
  },
  'Old Hanuman Temple': {
    mr: 'जुने हनुमान मंदिर',
    hi: 'पुराना हनुमान मंदिर',
  },
  'Bus Stand Area': {
    mr: 'बस स्थानक परिसर',
    hi: 'बस स्टैंड क्षेत्र',
  },
  'Gaothan Ward 2': {
    mr: 'गावठाण वॉर्ड क्र. २',
    hi: 'गांव वार्ड नं. 2',
  },
  'Behind Gram Panchayat Library': {
    mr: 'ग्रामपंचायत वाचनालयाच्या मागे',
    hi: 'ग्राम पंचायत पुस्तकालय के पीछे',
  },
  'Near Gram Panchayat Water Reservoir': {
    mr: 'ग्रामपंचायत पाण्याच्या टाकीजवळ',
    hi: 'ग्राम पंचायत जल जलाशय के पास',
  },
  'Public community toilet flush water supply failure and soak pit overflow': {
    mr: 'सार्वजनिक शौचालय फ्लश पाणीपुरवठा बंद व शोषखड्डा ओव्हरफ्लो',
    hi: 'सार्वजनिक सामुदायिक शौचालय फ्लश जलापूर्ति विफलता एवं सोक पिट ओवरफ्लो',
  },
  'Water motor pump burnt out. Soak pit overflowing into adjacent open ground. Urgent sanitation issue.': {
    mr: 'पाण्याचा मोटर पंप जळाला आहे. सांडपाणी उघड्या जागेवर पसरत आहे. तातडीची स्वच्छता समस्या.',
    hi: 'पानी का मोटर पंप जल गया है। सोक पिट का गंदा पानी खुले मैदान में बह रहा है। तत्काल स्वच्छता समस्या।',
  },
  'drinking water': {
    mr: 'पिण्याचे पाणी समस्या',
    hi: 'पीने के पानी की समस्या',
  },
  'water is so dirty': {
    mr: 'पाणी अतिशय गढूळ व अस्वच्छ येत आहे',
    hi: 'पानी बहुत गंदा और दूषित आ रहा है',
  },
  'Sanitation & Waste Management': {
    mr: 'स्वच्छता व कचरा व्यवस्थापन',
    hi: 'स्वच्छता एवं अपशिष्ट प्रबंधन',
  },
  'Sanitation & Waste': {
    mr: 'स्वच्छता व कचरा व्यवस्थापन',
    hi: 'स्वच्छता एवं अपशिष्ट प्रबंधन',
  },
  'Sanitation Lead': {
    mr: 'स्वच्छता प्रमुख',
    hi: 'स्वच्छता प्रमुख',
  },
  'Roads & Civil Works': {
    mr: 'रस्ते व नागरी बांधकाम',
    hi: 'सड़क एवं निर्माण कार्य',
  },
  'Roads & Works': {
    mr: 'रस्ते व बांधकाम',
    hi: 'सड़क एवं निर्माण कार्य',
  },
  'Roads Lead': {
    mr: 'रस्ते कार्य प्रमुख',
    hi: 'सड़क कार्य प्रमुख',
  },
  'Water Supply & PHE': {
    mr: 'पाणी पुरवठा व स्वच्छता',
    hi: 'पेयजल आपूर्ति एवं स्वच्छता',
  },
  'Water Supply': {
    mr: 'पाणी पुरवठा',
    hi: 'पेयजल आपूर्ति',
  },
  'Water Lead': {
    mr: 'पाणी पुरवठा प्रमुख',
    hi: 'पेयजल प्रमुख',
  },
  'PHE & Electrical': {
    mr: 'पाणी पुरवठा व विद्युत',
    hi: 'जलापूर्ति एवं विद्युत',
  },
  'Field Worker': {
    mr: 'क्षेत्रीय कर्मचारी',
    hi: 'फील्ड कार्यकर्ता',
  },
  'Specialist Lead': {
    mr: 'विशेषज्ञ कर्मचारी',
    hi: 'विशेषज्ञ कार्यकर्ता',
  },
};

/**
 * Universal text translator for civic data
 * @param {string} text - text to translate
 * @param {string} [lang] - target language code ('mr', 'hi', 'en')
 * @returns {string} translated text
 */
export function translateData(text, lang) {
  if (!text || typeof text !== 'string') return text;
  const targetLang = lang || i18n.language || 'en';
  if (targetLang === 'en') return text;

  // Exact match in dictionary
  if (DICTIONARY[text] && DICTIONARY[text][targetLang]) {
    return DICTIONARY[text][targetLang];
  }

  // Trimmed match
  const trimmed = text.trim();
  if (DICTIONARY[trimmed] && DICTIONARY[trimmed][targetLang]) {
    return DICTIONARY[trimmed][targetLang];
  }

  // Check case-insensitive match
  for (const [key, val] of Object.entries(DICTIONARY)) {
    if (trimmed.toLowerCase() === key.toLowerCase() && val[targetLang]) {
      return val[targetLang];
    }
  }

  // Regex pattern matching for dynamic seed titles: e.g. "Damaged road report at Ward 5 locality #24"
  const reportPattern = /^(.+?)\s+report\s+at\s+Ward\s+(\d+)\s+locality\s+#(\d+)$/i;
  const matchReport = trimmed.match(reportPattern);
  if (matchReport) {
    const rawCat = matchReport[1];
    const ward = matchReport[2];
    const loc = matchReport[3];
    const trCat = translateData(rawCat, targetLang);
    if (targetLang === 'mr') return `${trCat} तक्रार - वॉर्ड क्र. ${ward}, परिसर #${loc}`;
    if (targetLang === 'hi') return `${trCat} रिपोर्ट - वार्ड सं. ${ward}, क्षेत्र #${loc}`;
  }

  // Regex pattern matching for landmarks: e.g. "Near Pole #124"
  const polePattern = /^Near\s+Pole\s+#(\d+)$/i;
  const matchPole = trimmed.match(polePattern);
  if (matchPole) {
    const num = matchPole[1];
    if (targetLang === 'mr') return `विद्युत खांब क्र. #${num} जवळ`;
    if (targetLang === 'hi') return `बिजली का खंभा क्र. #${num} के पास`;
  }

  const lower = trimmed.toLowerCase();

  // Pattern matching for template descriptions: e.g. "Community civic issue regarding ... causing disruption to residents. Prompt resolution requested."
  if (lower.includes('community civic issue regarding') && lower.includes('prompt resolution requested')) {
    if (lower.includes('water supply failure') || lower.includes('water supply') || lower.includes('water')) {
      return targetLang === 'mr' ? 'नागरिकांची पाणी पुरवठ्याबाबत तक्रार, रहिवाशांना अडचण. त्वरित निवारणाची विनंती.' : 'नागरिकों की जलापूर्ति समस्या, निवासियों को असुविधा। शीघ्र समाधान अपेक्षित।';
    }
    if (lower.includes('damaged road') || lower.includes('road')) {
      return targetLang === 'mr' ? 'नागरिकांची खराब रस्त्याबाबत तक्रार, रहिवाशांना अडचण. त्वरित निवारणाची विनंती.' : 'नागरिकों की सड़क क्षति समस्या, निवासियों को असुविधा। शीघ्र समाधान अपेक्षित।';
    }
    if (lower.includes('waste') || lower.includes('sanitation') || lower.includes('garbage')) {
      return targetLang === 'mr' ? 'नागरिकांची अस्वच्छता व कचऱ्याबाबत तक्रार, त्वरित निवारणाची विनंती.' : 'नागरिकों की स्वच्छता व कचरे की समस्या, शीघ्र समाधान अपेक्षित।';
    }
    if (lower.includes('streetlight') || lower.includes('street light')) {
      return targetLang === 'mr' ? 'नागरिकांची बंद पथदिव्याबाबत तक्रार, त्वरित निवारणाची विनंती.' : 'नागरिकों की बंद स्ट्रीट लाइट की समस्या, शीघ्र समाधान अपेक्षित।';
    }
    if (lower.includes('drainage') || lower.includes('drain') || lower.includes('gutter')) {
      return targetLang === 'mr' ? 'नागरिकांची सांडपाणी नाला तुंबल्याची तक्रार, त्वरित निवारणाची विनंती.' : 'नागरिकों की नाली अवरोध समस्या, शीघ्र समाधान अपेक्षित।';
    }
    return targetLang === 'mr' ? 'गावातील नागरी समस्या, तातडीने दुरुस्तीची विनंती.' : 'ग्रामीण नागरिक समस्या, शीघ्र समाधान का अनुरोध।';
  }

  // Smart translation for Intelligence factor summaries
  if (lower.includes('specific landmark provided enhances location precision')) {
    if (targetLang === 'hi') {
      return 'विशिष्ट पहचान चिन्ह से स्थान सटीकता बढ़ी; आस-पास की 5 रिपोर्टों से भौगोलिक पुष्टि मिली।';
    }
    if (targetLang === 'mr') {
      return 'जवळच्या खूणेमुळे अचूक स्थान निश्चिती; परिसरातील ५ अहवालांमुळे भौगोलिक पुष्टी.';
    }
  }

  if (lower.includes('severity baseline: medium')) {
    if (targetLang === 'hi') return 'गंभीरता आधार स्तर: मध्यम (+20)';
    if (targetLang === 'mr') return 'तीव्रता आधार पातळी: मध्यम (+20)';
  }
  if (lower.includes('severity baseline: high')) {
    if (targetLang === 'hi') return 'गंभीरता आधार स्तर: उच्च (+35)';
    if (targetLang === 'mr') return 'तीव्रता आधार पातळी: उच्च (+35)';
  }
  if (lower.includes('severity baseline: critical')) {
    if (targetLang === 'hi') return 'गंभीरता आधार स्तर: अति गंभीर (+50)';
    if (targetLang === 'mr') return 'तीव्रता आधार पातळी: अतितातडीचे (+50)';
  }
  if (lower.includes('severity baseline: low')) {
    if (targetLang === 'hi') return 'गंभीरता आधार स्तर: निम्न (+10)';
    if (targetLang === 'mr') return 'तीव्रता आधार पातळी: कमी (+10)';
  }

  // Keyword / Fuzzy translation fallbacks for arbitrary user complaints
  if (lower.includes('streetlight') || lower.includes('street light') || lower.includes('street-light')) {
    if (lower.includes('not working') || lower.includes('off') || lower.includes('dark') || lower.includes('broken') || lower.includes('fault') || lower.includes('failure')) {
      return targetLang === 'hi' ? 'स्ट्रीट लाइट बंद होना' : 'पथदिवा (स्ट्रीटलाईट) बंद असणे';
    }
    return targetLang === 'hi' ? 'स्ट्रीट लाइट समस्या' : 'पथदिवा समस्या';
  }

  if (lower.includes('pothole') || (lower.includes('road') && (lower.includes('damage') || lower.includes('broken')))) {
    return targetLang === 'hi' ? 'सड़क पर गड्ढे एवं क्षति' : 'रस्त्यावरील खड्डे व नुकसान';
  }

  if (lower.includes('water') && (lower.includes('leak') || lower.includes('burst') || lower.includes('pipe'))) {
    return targetLang === 'hi' ? 'पेयजल पाइपलाइन रिसाव / लीकेज' : 'पाण्याची पाईपलाईन गळती';
  }

  if (lower.includes('drain') || lower.includes('drainage') || lower.includes('gutter')) {
    return targetLang === 'hi' ? 'नाली / ड्रेनेज अवरोध' : 'सांडपाणी नाला तुंबणे';
  }

  if (lower.includes('garbage') || lower.includes('waste') || lower.includes('trash') || lower.includes('dump')) {
    return targetLang === 'hi' ? 'कचरा जमा होना एवं अस्वच्छता' : 'कचरा साचणे व अस्वच्छता';
  }

  if (lower.includes('toilet') || lower.includes('sanitation')) {
    return targetLang === 'hi' ? 'सार्वजनिक स्वच्छता एवं शौचालय समस्या' : 'सार्वजनिक स्वच्छता व शौचालय समस्या';
  }

  return text;
}

export function translateCategory(cat, lang) {
  return translateData(cat, lang);
}

export function translateStatus(status, lang) {
  return translateData(status, lang);
}

export function translatePriority(priority, lang) {
  return translateData(priority, lang);
}

export function translateReliability(level, lang) {
  return translateData(level, lang);
}

export function translateAuditType(type, lang) {
  const targetLang = lang || i18n.language || 'en';
  if (targetLang === 'en') return (type || '').replace(/_/g, ' ');
  const map = {
    REPORT_SUBMITTED: { hi: 'समस्या दर्ज की गई', mr: 'तक्रार दाखल केली' },
    STATUS_CHANGE: { hi: 'स्थिति परिवर्तन', mr: 'स्थिती बदल' },
    WORKER_ASSIGNED: { hi: 'कार्यकर्ता नियुक्त', mr: 'कर्मचारी नियुक्त' },
    PROGRESS_UPDATE: { hi: 'प्रगति अद्यतन', mr: 'प्रगती अहवाल' },
    WORK_COMPLETED: { hi: 'कार्य पूर्ण', mr: 'काम पूर्ण' },
    ADMIN_VERIFIED: { hi: 'प्रशासन सत्यापन', mr: 'प्रशासन पडताळणी' },
    FEEDBACK_SUBMITTED: { hi: 'नागरिक प्रतिक्रिया', mr: 'नागरिक अभिप्राय' },
    COMMUNITY_VALIDATION: { hi: 'सामुदायिक सत्यापन', mr: 'नागरिक पडताळणी' },
  };
  return map[type]?.[targetLang] || (type || '').replace(/_/g, ' ');
}

