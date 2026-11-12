/* VITAL PWA v1 — no fake patients, no seeded data, no medical data in localStorage. */
(() => {
  'use strict';
  const FIELDS = [
    { key:'fullName', labelAr:'الاسم بالكامل', labelEn:'Full name', kind:'text', max:200 },
    { key:'birthDate', labelAr:'تاريخ الميلاد', labelEn:'Date of birth', kind:'date', max:30 },
    { key:'bloodGroup', labelAr:'فصيلة الدم (إن كانت مؤكدة)', labelEn:'Blood group (if verified)', kind:'select', max:10 },
    { key:'allergies', labelAr:'الحساسية وتفاعلاتها', labelEn:'Allergies and reactions', kind:'list', max:2000 },
    { key:'conditions', labelAr:'الأمراض والحالات المزمنة', labelEn:'Medical conditions', kind:'list', max:2000 },
    { key:'medications', labelAr:'الأدوية والجرعات الحالية', labelEn:'Current medications and doses', kind:'list', max:2000 },
    { key:'surgeries', labelAr:'العمليات الجراحية السابقة', labelEn:'Previous surgeries', kind:'list', max:2000 },
    { key:'contactName', labelAr:'اسم جهة اتصال الطوارئ', labelEn:'Emergency contact name', kind:'text', max:200 },
    { key:'contactPhone', labelAr:'رقم تليفون الطوارئ', labelEn:'Emergency phone number', kind:'tel', max:60 },
    { key:'emergencySummary', labelAr:'ملخص الحالة وقت الطوارئ', labelEn:'Emergency summary', kind:'textarea', max:800 },
  ];
  const TEXT = {
    ar:{ family:'الأسرة', familyTitle:'ملفات الأسرة', familyIntro:'ملفات خاصة بكل فرد تديره بمسؤولية وموافقة. لن تظهر في صفحة الطوارئ العامة.', familyAdd:'إضافة فرد للأسرة', familyEdit:'تعديل الملف', familyEmpty:'لم تُضف أفرادًا للأسرة بعد', familyRelation:'صلة القرابة', familyChild:'ابن / ابنة', familyParent:'أب / أم', familySpouse:'زوج / زوجة', familySibling:'أخ / أخت', familyOther:'قريب آخر', familyBasis:'أساس الإذن', familyGuardian:'أنا الولي أو الممثل القانوني', familyConsent:'موافقة صريحة من الشخص البالغ', familyAttestation:'أقر أن لدي الولاية القانونية أو الموافقة الصريحة من صاحب الملف على حفظ هذه البيانات.', familyConsentNote:'هذا إقرار منك فقط، وليس تحققًا قانونيًا من الموافقة. لا تُضف بيانات بالغ دون إذنه.', familySave:'حفظ ملف الفرد', familyDelete:'حذف ملف الفرد', familyConfirmDelete:'هل تريد حذف ملف هذا الفرد؟ احذف مستنداته أولًا. هذا الإجراء لا يمكن التراجع عنه.', familyDeleteHasDocs:'لا يمكن حذف هذا الفرد قبل حذف مستنداته الخاصة.', familySaved:'تم حفظ ملف الأسرة', familyRemoved:'تم حذف ملف الفرد', familyLoadError:'تعذر تحميل ملفات الأسرة', familyVault:'مستندات هذا الفرد', familyBack:'الرجوع للأسرة', familyPrivate:'الملفات العائلية خاصة بحسابك ولا تُنشئ كروت أو صفحات طوارئ مستقلة.', familyNoPublic:'الكروت وربط QR لأفراد الأسرة هنضيفهم لاحقًا مع لوحة الإدارة.', familyNeedName:'اكتب الاسم قبل الحفظ', familyNeedConsent:'لازم تؤكد الولاية أو الموافقة أولًا', familyPersonalDocs:'مستنداتي الشخصية', familyDocsFor:'مستندات', familyReload:'إعادة تحميل', home:'الرئيسية', profile:'الملف الطبي', vault:'مستنداتي', sharing:'الخصوصية والطوارئ', card:'كارت VITAL', app:'الهوية الطبية الذكية', greeting:'صحتك، معلوماتك، تحت سيطرتك', ready:'جاهزية الطوارئ', shared:'حقول منشورة', profileCompleted:'اكتمال الملف', yourCard:'الكارت الطبي', created:'تم إنشاء الكارت', noCard:'لسه ما أنشأتش كارت', cardState:'حالة نشر الطوارئ', noProfile:'ملفك الطبي لسه فاضي', noProfileDesc:'ابدأ بإضافة بياناتك الطبية الحقيقية. مش هنضيف أي بيانات من عندنا.', begin:'ابدأ الملف الطبي', preview:'معاينة صفحة الطوارئ', edit:'تعديل البيانات', profileTitle:'الملف الطبي الخاص', profileDesc:'البيانات دي خاصة بيك. مش هتظهر لأي شخص إلا لو اخترت نشرها في إعدادات الطوارئ.', addEntry:'إضافة بند', removeEntry:'حذف البند', itemPlaceholder:'اكتب التفاصيل هنا', maxEntries:'الحد الأقصى 30 بندًا في كل قسم', listTooLong:'القسم طويل جدًا؛ الحد الأقصى 2000 حرف', groupIntro:'أضف البنود واحدًا واحدًا، واحفظ في النهاية.', save:'حفظ التغييرات', privacyTitle:'إعدادات مشاركة الطوارئ', privacyDesc:'اختار كل معلومة تسمح بإظهارها لمن يفتح رابط QR أو NFC. جميع الخيارات مقفولة افتراضيًا.', publish:'حفظ ونشر المعلومات المختارة', update:'تحديث البيانات المنشورة', stop:'إيقاف نشر صفحة الطوارئ', shareDisabled:'غير ظاهر للعموم', shareEnabled:'مسموح بعرضه وقت الطوارئ', cardTitle:'كارت VITAL الرقمي', cardDesc:'الرابط ده تقدر تبرمجه على NFC أو تطبعه QR. ما يحتويش أي بيانات طبية داخل الرمز نفسه.', makeCard:'إنشاء رابط كارت جديد', cardNotCreated:'مفيش كارت مرتبط بالحساب حتى الآن', cardHint:'أنشئ رابط الكارت الأول، وبعدها انشر المعلومات اللي وافقت على عرضها.', copy:'نسخ الرابط', open:'فتح صفحة الطوارئ', live:'منشور للعامة', offline:'غير منشور', signIn:'تسجيل الدخول', signUp:'إنشاء حساب', email:'البريد الإلكتروني', password:'كلمة المرور', loginWelcome:'مرحبًا بيك في VITAL', loginDesc:'ادخل على حسابك علشان تدير ملفك الطبي وخصوصيتك.', createAccount:'إنشاء حساب جديد', confirmEmail:'تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده لو مطلوب، وبعدها سجّل دخول.', logout:'تسجيل الخروج', medicalInfo:'البيانات الطبية', emergencyLink:'رابط الطوارئ', notReady:'غير جاهز بعد', active:'مفعل', none:'غير محدد', verified:'منشور بموافقتك', draft:'بيانات خاصة', critical:'معلومة حساسة', sharedHint:'الرابط متاح لأي شخص معاه QR أو NFC. انشر أقل قدر ضروري فقط.', confirmPublish:'هل أنت متأكد أنك تريد نشر الحقول المحددة لأي شخص يمتلك رابط الطوارئ؟', confirmStop:'إيقاف الصفحة العامة ومسح المعلومات المنشورة؟', mustCard:'أنشئ رابط كارت أولًا.', mustChoose:'اختار حقلًا واحدًا على الأقل يحتوي بيانات فعلية.', saved:'تم حفظ البيانات بنجاح', publishSuccess:'تم تحديث صفحة الطوارئ', stopSuccess:'تم إيقاف نشر معلومات الطوارئ', vaultTitle:'خزنة المستندات الطبية', vaultIntro:'احتفظ بتقاريرك وصور الأشعة والتحاليل في مكان خاص. لا تظهر المستندات في صفحة الطوارئ.', vaultUpload:'رفع مستند', vaultDocTitle:'عنوان المستند', vaultType:'نوع المستند', vaultDate:'تاريخ المستند (اختياري)', vaultFile:'اختيار PDF أو صورة', vaultSave:'حفظ المستند', vaultEmpty:'مافيش مستندات مرفوعة لسه', vaultEmptyDesc:'ارفع أول مستند خاص بيك. لا توجد ملفات تجريبية.', vaultPrivate:'هذه المستندات خاصة بحسابك فقط ولا تظهر عند مسح QR.', vaultAll:'كل الأنواع', vaultLab:'تحاليل', vaultImaging:'أشعة', vaultPrescription:'روشتات', vaultReport:'تقارير', vaultOther:'أخرى', vaultView:'عرض', vaultDownload:'تنزيل', vaultDelete:'حذف', vaultConfirmDelete:'هل تريد حذف هذا المستند نهائيًا؟', vaultSaved:'تم رفع المستند وحفظه', vaultDeleted:'تم حذف المستند', vaultLoading:'جاري تحميل المستندات...', vaultRetry:'إعادة المحاولة', vaultMax:'الحد الأقصى لكل ملف 10 ميجابايت، والأنواع المسموحة PDF وJPG وPNG وWebP.', vaultInvalid:'الملف غير مسموح به أو حجمه غير مناسب.', vaultUploadFailed:'تعذّر رفع الملف، حاول مجددًا.', vaultLoadFailed:'تعذّر تحميل قائمة المستندات.', vaultClose:'إغلاق', vaultPreview:'معاينة المستند', vaultOpenPdf:'فتح PDF في المتصفح', vaultPdfHelp:'ملفات PDF تفتح في عارض المتصفح لتجنب الصفحة البيضاء على بعض أجهزة الآيفون. الرابط مؤقت وصالح لدقيقتين فقط.', vaultOpenImage:'فتح الصورة في المتصفح', vaultImageLoading:'جاري تحميل الصورة...', vaultImageError:'تعذّر عرض الصورة داخل VITAL. جرّب فتحها في المتصفح.', resumeCard:'إعادة تفعيل صفحة الطوارئ', confirmResume:'سيتم نشر المعلومات التي اخترت مشاركتها مرة أخرى على نفس رابط الكارت. هل تريد المتابعة؟', resumeSuccess:'تمت إعادة تفعيل صفحة الطوارئ', configureSharing:'اختار معلومات الطوارئ أولًا', copied:'اتنسخ الرابط', noLink:'لا يوجد رابط حتى الآن', afterLogin:'استعراض معلوماتك', enterValue:'اكتب هنا', emergency:'معلومات الطوارئ الطبية', emergencyWarning:'بيانات يشاركها صاحب الملف بنفسه وقد لا تكون موثقة طبيًا. لا تعتمد عليها وحدها لاتخاذ قرار علاجي.', inactive:'صفحة الطوارئ غير متاحة', inactiveDesc:'هذا الكارت غير مفعل أو لم يتم نشر أي معلومات عليه. لا توجد بيانات طبية متاحة من هذا الرابط.', call:'الاتصال بجهة الطوارئ', powered:'VITAL — Your Medical Identity. When It Matters Most.', loading:'تحميل المعلومات...', currentState:'حالة الصفحة العامة', language:'EN', editSharing:'إدارة المشاركة', fillProfile:'أكمل ملفك', noFields:'لا توجد بيانات مشتركة', emptyDetail:'لم تقم بإضافة بيانات لهذه الخانة', publicView:'بيانات مرئية للعامة', account:'الحساب', saveFirst:'احفظ بياناتك الطبية أولًا', noRealData:'لا توجد بيانات افتراضية أو مرضى تجريبيون', installed:'إضافة للشاشة الرئيسية', security:'المعلومات محفوظة داخل حسابك الخاص. لا تشارك رمز الدخول مع أحد.'},
    en:{ family:'Family', familyTitle:'Family profiles', familyIntro:'Private profiles for people you are legally authorized to assist. Never shown on the public emergency page.', familyAdd:'Add family member', familyEdit:'Edit profile', familyEmpty:'No family members added yet', familyRelation:'Relationship', familyChild:'Child', familyParent:'Parent', familySpouse:'Spouse', familySibling:'Sibling', familyOther:'Other relative', familyBasis:'Authority basis', familyGuardian:'I am the legal guardian or representative', familyConsent:'Explicit permission from this adult', familyAttestation:'I confirm that I have lawful authority or explicit permission to store this person’s information.', familyConsentNote:'This is your own attestation, not verified consent. Do not enter another adult’s information without permission.', familySave:'Save member', familyDelete:'Delete member', familyConfirmDelete:'Delete this family member? Remove their documents first. This cannot be undone.', familyDeleteHasDocs:'Delete this member’s documents before deleting the profile.', familySaved:'Family profile saved', familyRemoved:'Member removed', familyLoadError:'Unable to load family profiles', familyVault:'Member documents', familyBack:'Back to family', familyPrivate:'Family profiles are private to your account and do not create separate emergency IDs.', familyNoPublic:'Family QR/device activation will be introduced with the Admin system later.', familyNeedName:'Enter a name before saving', familyNeedConsent:'Confirm your authority or permission first', familyPersonalDocs:'My personal documents', familyDocsFor:'Documents for', familyReload:'Reload', home:'Home', profile:'Medical Profile', vault:'My Documents', sharing:'Emergency Sharing', card:'VITAL Card', app:'Your smart medical identity', greeting:'Your health. Your identity. Your control.', ready:'Emergency readiness', shared:'Published fields', profileCompleted:'Profile completeness', yourCard:'Medical card', created:'Card created', noCard:'No card yet', cardState:'Emergency page status', noProfile:'Your profile is empty', noProfileDesc:'Start by entering your own medical information. Nothing is pre-filled.', begin:'Create medical profile', preview:'Preview emergency page', edit:'Edit medical data', profileTitle:'Private medical profile', profileDesc:'This is private. Nothing becomes public unless you explicitly enable emergency sharing.', addEntry:'Add item', removeEntry:'Remove item', itemPlaceholder:'Enter details here', maxEntries:'Up to 30 items per section', listTooLong:'This section exceeds the 2,000 character limit', groupIntro:'Add entries one by one, then save the profile.', save:'Save changes', privacyTitle:'Emergency sharing settings', privacyDesc:'Choose the exact fields accessible to someone scanning your QR or NFC tag. Everything is off by default.', publish:'Save and publish selected fields', update:'Update published information', stop:'Stop public sharing', shareDisabled:'Private', shareEnabled:'Visible in emergency', cardTitle:'Digital VITAL card', cardDesc:'This URL can be programmed into NFC or printed as a QR. It does not contain medical details itself.', makeCard:'Create card link', cardNotCreated:'No card attached to this account', cardHint:'Create a secure card link, then publish selected emergency information.', copy:'Copy link', open:'Open emergency page', live:'Publicly visible', offline:'Not published', signIn:'Sign in', signUp:'Create account', email:'Email address', password:'Password', loginWelcome:'Welcome to VITAL', loginDesc:'Sign in to manage your medical information and privacy.', createAccount:'Create a new account', confirmEmail:'Account created. Confirm your email if required, then sign in.', logout:'Sign out', medicalInfo:'Medical information', emergencyLink:'Emergency link', notReady:'Not ready yet', active:'Active', none:'Not provided', verified:'Shared with your approval', draft:'Private data', critical:'Sensitive information', sharedHint:'Anyone with this QR/NFC link may view your published data. Share only what is necessary.', confirmPublish:'Publish these selected fields to anyone who holds the emergency link?', confirmStop:'Disable the public emergency page and erase its published snapshot?', mustCard:'Create a card link first.', mustChoose:'Select at least one non-empty field.', saved:'Changes saved', publishSuccess:'Emergency page updated', stopSuccess:'Emergency page disabled', vaultTitle:'Medical Document Vault', vaultIntro:'Keep your reports, scans and lab results private. Documents are never shown on your emergency page.', vaultUpload:'Upload document', vaultDocTitle:'Document title', vaultType:'Document category', vaultDate:'Document date (optional)', vaultFile:'Choose PDF or image', vaultSave:'Save document', vaultEmpty:'No documents yet', vaultEmptyDesc:'Upload your first private document. Nothing is preloaded.', vaultPrivate:'Documents are private to your account and never appear when someone scans your QR.', vaultAll:'All categories', vaultLab:'Lab results', vaultImaging:'Imaging', vaultPrescription:'Prescriptions', vaultReport:'Medical reports', vaultOther:'Other', vaultView:'View', vaultDownload:'Download', vaultDelete:'Delete', vaultConfirmDelete:'Delete this document permanently?', vaultSaved:'Document uploaded and saved', vaultDeleted:'Document deleted', vaultLoading:'Loading documents...', vaultRetry:'Retry', vaultMax:'10 MB per file. PDF, JPG, PNG and WebP only.', vaultInvalid:'Unsupported file type or size.', vaultUploadFailed:'Could not upload document. Try again.', vaultLoadFailed:'Could not load documents.', vaultClose:'Close', vaultPreview:'Document preview', vaultOpenPdf:'Open PDF in browser', vaultPdfHelp:'PDFs open in the browser viewer to avoid a blank preview on some iPhones. This private link expires in two minutes.', vaultOpenImage:'Open image in browser', vaultImageLoading:'Loading image...', vaultImageError:'Could not preview this image in VITAL. Try opening it in the browser.', resumeCard:'Reactivate emergency page', confirmResume:'Publish your selected emergency information again at the same card URL?', resumeSuccess:'Emergency page reactivated', configureSharing:'Choose emergency information first', copied:'Link copied', noLink:'No link yet', afterLogin:'View profile', enterValue:'Enter here', emergency:'Emergency medical information', emergencyWarning:'This information is self-reported and may not be medically verified. Do not rely on it alone for clinical decisions.', inactive:'Emergency page unavailable', inactiveDesc:'The card is inactive or its owner has not published any emergency information. No medical data is available.', call:'Call emergency contact', powered:'VITAL — Your Medical Identity. When It Matters Most.', loading:'Loading information...', currentState:'Public page status', language:'ع', editSharing:'Manage sharing', fillProfile:'Complete profile', noFields:'No shared information', emptyDetail:'No information provided', publicView:'Public information', account:'Account', saveFirst:'Save your medical information first', noRealData:'No fictional or seeded patient data', installed:'Add to home screen', security:'Your information is private. Never share your password or sign-in link.'}
  };
  const state = {lang:localStorage.getItem('vital_lang')==='en'?'en':'ar', tab:'home', mode:'signin', session:null, user:null, profile:blankProfile(), loading:false, emergency:null, busy:false, documents:[], vaultLoaded:false, vaultError:false, vaultFilter:'all',vaultProfileId:null,familyProfiles:[],familyLoaded:false,familyError:false,familyMode:'list',familySelectedId:null, previewUrl:null};
  const root = document.getElementById('app'); const toast = document.getElementById('toast');
  const config = window.VITAL_CONFIG || {};
  function isSafePublicKey(key){
    if(/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key))return true;
    if(!/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key))return false;
    try {return JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}
    catch {return false;}
  }
  const configured = /^https:\/\/[\w-]+\.supabase\.co\/?$/.test(String(config.supabaseUrl || '')) && isSafePublicKey(String(config.publishableKey || ''));
  const base = String(config.supabaseUrl || '').replace(/\/$/, '');
  function blankProfile(){return {fields:Object.fromEntries(FIELDS.map(f=>[f.key,''])),sharing:Object.fromEntries(FIELDS.map(f=>[f.key,false])),card_token:null,published:false};}
  function t(k){return (TEXT[state.lang]||TEXT.ar)[k]||k;}
  function L(field){return state.lang==='ar'?field.labelAr:field.labelEn;}
  function escapeHTML(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  const I = (name,size=20) => {const paths={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',credit:'<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',pulse:'<path d="M2 12h5l3-7 4 14 3-7h5"/>',arrow:'<path d="m9 18 6-6-6-6"/>',check:'<path d="m4 12 5 5L20 6"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18M12 3C7 8 7 16 12 21"/>',qr:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM21 14v7h-7v-3"/>',plus:'<path d="M12 5v14M5 12h14"/>',edit:'<path d="M12 20h9M16 4l4 4-10 10-5 1 1-5 10-10z"/>',copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',exit:'<path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/>',alert:'<path d="m12 3 10 18H2zM12 9v5M12 18h.01"/>',moon:'<path d="M21 12a9 9 0 0 1-9-9 9 9 0 1 0 9 9z"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8L7 10a16 16 0 0 0 7 7l1.5-2a2 2 0 0 1 1.8-.6l3 .5a2 2 0 0 1 1.7 2z"/>',chevron:'<path d="m9 18 6-6-6-6"/>'};return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">${paths[name]||paths.shield}</svg>`;};
  function notify(msg){toast.textContent=msg;toast.classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>toast.classList.remove('visible'),3500);}
  function setLang(lang){state.lang=lang;localStorage.setItem('vital_lang',lang);document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';root.classList.toggle('dir-en',lang==='en');}
  function validConfig(){if(configured)return true;renderSetup();return false;}
  async function request(path,{method='GET',body=null,auth=false,retry=true}={}){
    if(!configured)throw Error('Supabase is not configured.');
    if(auth&&state.session&&state.session.expires_at<Date.now()+30000)await refresh();
    const headers={'apikey':config.publishableKey,'Content-Type':'application/json'};
    if(auth&&state.session?.access_token)headers.Authorization='Bearer '+state.session.access_token;
    const response=await fetch(base+path,{method,headers,body:body===null?undefined:JSON.stringify(body),cache:'no-store',referrerPolicy:'no-referrer'});
    if(response.status===401&&auth&&retry&&state.session?.refresh_token){await refresh();return request(path,{method,body,auth,retry:false});}
    const txt=await response.text();let json;try{json=txt?JSON.parse(txt):null;}catch{json={message:txt};}
    if(!response.ok)throw Error(json?.msg||json?.message||json?.error_description||json?.error||`Request failed (${response.status})`);
    return json;
  }
  function setSession(json){const data=json?.session||json;if(!data?.access_token||!data?.refresh_token)throw Error('Session is unavailable. Check email verification.');state.session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+Math.max(60,data.expires_in||3600)*1000};sessionStorage.setItem('vital_session',JSON.stringify(state.session));}
  async function refresh(){if(!state.session?.refresh_token)throw Error('Please sign in again.');const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:state.session.refresh_token},auth:false});setSession(data);}
  async function authenticate(email,password,signup){const path=signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password';const data=await request(path,{method:'POST',body:{email,password}});if(signup&&!data?.access_token){state.mode='signin';render();notify(t('confirmEmail'));return;}setSession(data);await afterLogin();}
  async function afterLogin(){const user=await request('/auth/v1/user',{auth:true});state.user=user;resetVault();resetFamily();await loadProfile();state.tab='home';render();}
  async function loadProfile(){const records=await request('/rest/v1/medical_profiles?select=fields,sharing,card_token,published&limit=1',{auth:true});const row=Array.isArray(records)?records[0]:null;const clean=blankProfile();if(row){for(const f of FIELDS){clean.fields[f.key]=typeof row.fields?.[f.key]==='string'?row.fields[f.key]:'';clean.sharing[f.key]=row.sharing?.[f.key]===true;}clean.card_token=row.card_token||null;clean.published=row.published===true;}state.profile=clean;}
  function getFieldsFromForm(){
    const fields={};
    for(const f of FIELDS){
      if(f.kind==='list'){
        const items=[...root.querySelectorAll(`[data-med-list="${f.key}"] [data-med-entry]`)];
        // Existing plain-text rows are retained as independent entries; no new data format.
        fields[f.key]=items.map(el=>el.value.replace(/\r/g,'').trim())
          .filter(Boolean).join('\n');
      }else{
        fields[f.key]=String(root.querySelector(`[name="${f.key}"]`)?.value||'').trim();
      }
      if(fields[f.key].length>f.max)throw Error(t('listTooLong')+' — '+L(f));
    }
    return fields;
  }
  function getSharingFromForm(){const sharing={};for(const f of FIELDS)sharing[f.key]=Boolean(document.querySelector(`[name="share-${f.key}"]`)?.checked);return sharing;}
  async function saveProfile(publish, updateFields=null, updateSharing=null){const fields=updateFields||state.profile.fields;const sharing=updateSharing||state.profile.sharing;const res=await request('/rest/v1/rpc/vital_save_profile',{method:'POST',body:{p_fields:fields,p_sharing:sharing,p_publish:publish},auth:true});await loadProfile();return res;}
  async function createCard(){const arr=new Uint8Array(20);crypto.getRandomValues(arr);const token=[...arr].map(v=>v.toString(16).padStart(2,'0')).join('');await request('/rest/v1/rpc/vital_create_card',{method:'POST',body:{p_token:token},auth:true});await loadProfile();}
  async function loadEmergency(token){return request('/rest/v1/rpc/vital_get_emergency',{method:'POST',body:{p_token:token}});}
  function routeEmergency(){const p=location.pathname.match(/^\/e\/([a-f0-9]{40})\/?$/);return p?p[1]:null;}
  function emergencyUrl(){return state.profile.card_token?`${location.origin}/e/${state.profile.card_token}`:'';}
  function navButton(tab,title,icon){return `<button type="button" class="${state.tab===tab?'active':''}" data-tab="${tab}" aria-current="${state.tab===tab?'page':'false'}">${I(icon,19)}<span>${escapeHTML(title)}</span></button>`;}
  function userInitial(){const name=state.profile.fields.fullName||state.user?.email||'V';return escapeHTML((Array.from(name.trim())[0]||'V').toUpperCase());}
  function renderSetup(){setLang(state.lang);root.innerHTML=`<section class="surface setup"><div class="brand"><img src="/assets/icon.svg" alt=""/> VITAL</div><h1>${state.lang==='ar'?'خطوة واحدة لربط قاعدة البيانات':'One step to connect the database'}</h1><p class="small">${state.lang==='ar'?'كود التطبيق جاهز، لكن لازم تضع Project URL وPublishable Key الخاصة بمشروع Supabase جديد في ملف config.js. بدونهم لن نجمع أو نعرض أي بيانات.':'Add your Supabase Project URL and public publishable key to config.js. No data is collected before configuration.'}</p><pre>window.VITAL_CONFIG = {\n  supabaseUrl: "https://YOUR_PROJECT.supabase.co",\n  publishableKey: "sb_publishable_..."\n};</pre><div class="notice warning">${state.lang==='ar'?'ممنوع وضع Service Role أو Secret Key هنا. لا تدخل بيانات طبية حقيقية قبل مراجعة الاختبارات والصلاحيات.':'Never put a secret/service_role key here. Do not enter real sensitive medical information before security review.'}</div></section>`;}
  function renderAuth(){setLang(state.lang);root.innerHTML=`<div class="auth-wrap"><div class="auth-left"><div class="brand"><img src="/assets/icon.svg" alt=""/> <div>VITAL<small>MEDICAL IDENTITY</small></div></div><div class="auth-message"><div class="spark">YOUR MEDICAL IDENTITY</div><h1>${escapeHTML(t('greeting'))}</h1><p>${escapeHTML(t('app'))}. Your Medical Identity. When It Matters Most.</p></div><div class="auth-copy">© VITAL</div></div><div class="auth-right"><div class="auth-card"><div class="badge">${I('shield',14)} PRIVATE & SECURE</div><h2>${state.mode==='signup'?t('createAccount'):t('loginWelcome')}</h2><p>${t('loginDesc')}</p><form id="auth-form"><div class="field"><label for="email">${t('email')}</label><input required autocomplete="email" type="email" class="input" id="email" name="email" dir="ltr"/></div><div class="field"><label for="password">${t('password')}</label><input required autocomplete="${state.mode==='signup'?'new-password':'current-password'}" minlength="8" type="password" class="input" id="password" name="password" dir="ltr"/></div><button class="btn primary full" type="submit">${state.mode==='signup'?t('signUp'):t('signIn')} ${I('arrow',16)}</button></form><div class="auth-foot"><button data-action="switch-auth" type="button">${state.mode==='signup'?t('signIn'):t('createAccount')}</button></div><div class="divider"></div><div class="notice">${I('lock',15)} ${t('security')}</div><div style="display:flex;justify-content:center;margin-top:20px"><button class="text-link" data-action="toggle-lang" type="button">${I('globe',15)} ${t('language')}</button></div></div></div></div>`;}
  function displayName(){return state.profile.fields.fullName.trim()||'VITAL';}
  function statusBadge(){return `<span class="badge ${state.profile.published?'':'off'}">${I(state.profile.published?'check':'lock',13)} ${state.profile.published?t('live'):t('offline')}</span>`;}
  function countCompleted(){return FIELDS.filter(f=>String(state.profile.fields[f.key]||'').trim()).length;}
  function countShared(){return FIELDS.filter(f=>state.profile.sharing[f.key]&&String(state.profile.fields[f.key]||'').trim()).length;}
  function renderHome(){const count=countCompleted(), total=FIELDS.length;return `<section class="stack"><div class="hero surface"><div class="eyebrow">VITAL • MEDICAL IDENTITY</div><h2>${escapeHTML(displayName())}</h2><p>${t('greeting')}</p><div class="bottom"><span class="badge white">${I('shield',13)} ${state.profile.published?t('live'):t('draft')}</span><div class="brandmark">VITAL</div></div></div><div class="metrics"><div class="metric"><div class="metric-icon">${I('user',17)}</div><strong>${Math.round(100*count/total)}%</strong><span>${t('profileCompleted')}</span></div><div class="metric"><div class="metric-icon">${I('shield',17)}</div><strong>${state.profile.published?countShared():0}</strong><span>${t('shared')}</span></div><div class="metric"><div class="metric-icon">${I('credit',17)}</div><strong>${state.profile.card_token?'01':'00'}</strong><span>${t('yourCard')}</span></div></div><div class="grid-2"><div class="surface"><div class="section-head"><h2>${t('medicalInfo')}</h2><button class="text-link" data-tab="profile">${t('edit')} ${I('arrow',13)}</button></div>${count===0?`<div class="empty">${I('user',34)}<strong>${t('noProfile')}</strong><p>${t('noProfileDesc')}</p><button class="btn primary" data-tab="profile">${t('begin')}</button></div>`:`<div class="list-rows">${FIELDS.filter(f=>state.profile.fields[f.key]?.trim()).slice(0,5).map(f=>`<div class="list-row"><div class="lead"><div class="mini-icon">${I('pulse',17)}</div><div><strong>${escapeHTML(L(f))}</strong><small>${escapeHTML(state.profile.fields[f.key]).slice(0,80)}${state.profile.fields[f.key].length>80?'…':''}</small></div></div>${I('check',15)}</div>`).join('')}</div>`}</div><div class="stack"><div class="surface"><div class="section-head"><h2>${t('ready')}</h2>${statusBadge()}</div><p class="small">${t('sharedHint')}</p><div class="progress-bar"><div style="width:${state.profile.published?Math.round(countShared()/9*100):0}%"></div></div><div style="margin-top:20px"><button class="btn navy full" data-tab="sharing">${I('shield',16)} ${t('editSharing')}</button></div></div><div class="surface"><div class="section-head"><h2>${t('emergencyLink')}</h2><div class="mini-icon">${I('qr',19)}</div></div><p class="small">${state.profile.card_token?t('created'):t('noCard')}</p><button class="btn ghost full" data-tab="card">${t('yourCard')} ${I('arrow',15)}</button></div></div></div></section>`;}
  const MED_GROUPS = [
    {ar:'البيانات الأساسية',en:'Basic details',descAr:'الاسم وتاريخ الميلاد وفصيلة الدم لو مؤكدة.',descEn:'Name, date of birth, and confirmed blood group.',keys:['fullName','birthDate','bloodGroup'],icon:'user'},
    {ar:'الحساسية',en:'Allergies',descAr:'كل حساسية وتفاعلها في بند مستقل.',descEn:'Add each allergy and its reaction separately.',keys:['allergies'],icon:'alert'},
    {ar:'الأمراض والحالات المزمنة',en:'Medical conditions',descAr:'أضف الحالات المرضية واحدة واحدة.',descEn:'Add your medical conditions one by one.',keys:['conditions'],icon:'pulse'},
    {ar:'الأدوية الحالية',en:'Current medications',descAr:'اكتب اسم الدواء والجرعة والتكرار في كل بند.',descEn:'Include medicine, dose, and frequency in each item.',keys:['medications'],icon:'pulse'},
    {ar:'العمليات الجراحية السابقة',en:'Previous surgeries',descAr:'تاريخ العملية وتفاصيلها إن وجدت.',descEn:'List past surgeries and dates if known.',keys:['surgeries'],icon:'user'},
    {ar:'جهات الاتصال وملخص الطوارئ',en:'Emergency contacts & summary',descAr:'معلومات مهمة تفضل خاصة إلا إذا سمحت بمشاركتها.',descEn:'Private unless you explicitly share them.',keys:['contactName','contactPhone','emergencySummary'],icon:'phone'}
  ];
  function medicalEntryMarkup(f,value,index){
    return `<div class="med-entry"><div class="med-entry-num">${String(index).padStart(2,'0')}</div><textarea class="input med-entry-input" data-med-entry rows="2" maxlength="${f.max}" aria-label="${escapeHTML(L(f))} ${index}" placeholder="${escapeHTML(t('itemPlaceholder'))}">${escapeHTML(value)}</textarea><button type="button" class="med-remove" data-action="remove-med-entry" aria-label="${escapeHTML(t('removeEntry'))}" title="${escapeHTML(t('removeEntry'))}">×</button></div>`;
  }
  function renderField(f, recordFields=state.profile.fields){
    const value=escapeHTML(recordFields[f.key]||'');
    if(f.kind==='list'){
      const items=String(recordFields[f.key]||'').split(/\r?\n/).filter(x=>x.trim());
      return `<div class="field wide" data-med-list="${f.key}"><label>${escapeHTML(L(f))}</label><div class="med-entry-list">${items.map((item,i)=>medicalEntryMarkup(f,item,i+1)).join('')}</div><button type="button" class="med-add" data-action="add-med-entry" data-med-key="${f.key}">${I('plus',16)} ${escapeHTML(t('addEntry'))}</button></div>`;
    }
    let control;
    if(f.kind==='textarea')control=`<textarea id="f-${f.key}" class="input" name="${f.key}" maxlength="${f.max}" placeholder="${t('enterValue')}">${value}</textarea>`;
    else if(f.kind==='select')control=`<select id="f-${f.key}" class="input" name="${f.key}"><option value="">${t('none')}</option>${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b=>`<option value="${b}" ${value===b?'selected':''}>${b}</option>`).join('')}</select>`;
    else control=`<input id="f-${f.key}" class="input" type="${f.kind}" name="${f.key}" maxlength="${f.max}" value="${value}" ${f.kind==='tel'?'dir="ltr"':''}/>`;
    return `<div class="field ${f.key==='emergencySummary'?'wide':''}"><label for="f-${f.key}">${escapeHTML(L(f))}</label>${control}${f.key==='emergencySummary'?'<small class="helper">800 characters maximum</small>':''}</div>`;
  }
  function renderProfile(){
    const lang=state.lang;
    return `<div class="page-intro"><h2>${t('profileTitle')}</h2><p>${t('profileDesc')}</p></div><form id="profile-form" class="stack med-profile-form"><div class="notice">${I('lock',17)} ${t('groupIntro')}</div>${MED_GROUPS.map((group,i)=>`<section class="surface medical-section"><header class="medical-section-head"><div class="medical-section-icon">${I(group.icon,20)}</div><div class="medical-section-copy"><span class="medical-eyebrow">${String(i+1).padStart(2,'0')} / 06</span><h3>${escapeHTML(lang==='ar'?group.ar:group.en)}</h3><p>${escapeHTML(lang==='ar'?group.descAr:group.descEn)}</p></div></header><div class="form-grid">${group.keys.map(key=>renderField(FIELDS.find(f=>f.key===key))).join('')}</div></section>`).join('')}<div class="notice">${I('shield',17)} ${t('security')}</div><div class="med-save-bar"><button type="submit" class="btn primary full">${I('check',16)} ${t('save')}</button></div></form>`;
  }

  const FAMILY_RELATIONS=['child','parent','spouse','sibling','other'];
  function familyLabels(){return {child:t('familyChild'),parent:t('familyParent'),spouse:t('familySpouse'),sibling:t('familySibling'),other:t('familyOther')};}
  function familyMember(id){return state.familyProfiles.find(x=>x.id===id);}
  function familyBlank(){return {fields:Object.fromEntries(FIELDS.map(f=>[f.key,''])),relationship:'child',authority_basis:'legal_guardian'};}
  async function loadFamilyProfiles(){
    try {
      const rows=await request('/rest/v1/family_profiles?select=id,relationship,authority_basis,fields,created_at&owner_uid=eq.'+encodeURIComponent(state.user.id)+'&order=created_at.desc&limit=100',{auth:true});
      state.familyProfiles=Array.isArray(rows)?rows:[];state.familyLoaded=true;state.familyError=false;
    }catch(err){state.familyError=true;state.familyLoaded=true;throw err;}
  }
  async function saveFamilyMember(form){
    if(!form.querySelector('[name="familyAttest"]')?.checked)throw Error(t('familyNeedConsent'));
    const fields=getFieldsFromForm();
    if(!fields.fullName?.trim())throw Error(t('familyNeedName'));
    const relationship=String(form.querySelector('[name="familyRelationship"]')?.value||'');
    const authority_basis=String(form.querySelector('[name="familyAuthority"]')?.value||'');
    if(!FAMILY_RELATIONS.includes(relationship)||!['legal_guardian','express_consent'].includes(authority_basis))throw Error('Invalid relationship or consent');
    const body={fields,relationship,authority_basis,consent_attested_at:new Date().toISOString()};
    if(state.familyMode==='new'){
      await request('/rest/v1/family_profiles',{method:'POST',auth:true,body:{...body,id:crypto.randomUUID(),owner_uid:state.user.id}});
    }else{
      const member=familyMember(state.familySelectedId);
      if(!member)throw Error(t('familyLoadError'));
      await request('/rest/v1/family_profiles?id=eq.'+encodeURIComponent(member.id)+'&owner_uid=eq.'+encodeURIComponent(state.user.id),{method:'PATCH',auth:true,body:{...body,updated_at:new Date().toISOString()}});
    }
    await loadFamilyProfiles();state.familyMode='list';state.familySelectedId=null;
  }
  async function deleteFamilyMember(member){
    if(!member||!confirm(t('familyConfirmDelete')))return false;
    const docs=await request('/rest/v1/medical_documents?select=id&family_profile_id=eq.'+encodeURIComponent(member.id)+'&limit=1',{auth:true});
    if(docs.length)throw Error(t('familyDeleteHasDocs'));
    await request('/rest/v1/family_profiles?id=eq.'+encodeURIComponent(member.id)+'&owner_uid=eq.'+encodeURIComponent(state.user.id),{method:'DELETE',auth:true});
    await loadFamilyProfiles();state.familyMode='list';state.familySelectedId=null;return true;
  }
  function renderFamily(){
    const labels=familyLabels();
    const back=`<button type="button" class="btn ghost" data-action="family-back">${I('arrow',15)} ${t('familyBack')}</button>`;
    if(state.familyMode==='list'){
      return `<section class="stack family-stack"><div class="page-intro"><h2>${t('familyTitle')}</h2><p>${t('familyIntro')}</p></div>
        <div class="notice">${I('lock',16)} ${t('familyPrivate')}</div>
        <div class="family-toolbar"><button type="button" class="btn primary" data-action="family-new">${I('plus',16)} ${t('familyAdd')}</button></div>
        ${!state.familyLoaded?`<div class="surface">${t('vaultLoading')}</div>`:state.familyError?`<div class="surface"><p>${t('familyLoadError')}</p><button type="button" class="btn ghost" data-action="family-reload">${t('familyReload')}</button></div>`:!state.familyProfiles.length?`<div class="surface empty">${I('user',34)}<strong>${t('familyEmpty')}</strong></div>`:
        `<div class="family-grid">${state.familyProfiles.map(m=>`<article class="surface family-card"><div class="family-avatar">${escapeHTML((Array.from(String(m.fields?.fullName||'').trim())[0]||'V').toUpperCase())}</div><div class="family-name">${escapeHTML(m.fields?.fullName||'')}</div><span class="badge">${escapeHTML(labels[m.relationship]||t('familyOther'))}</span><p class="small">${t('familyPrivate')}</p><div class="btn-group"><button type="button" class="btn navy" data-action="family-edit" data-member-id="${escapeHTML(m.id)}">${I('edit',15)} ${t('familyEdit')}</button><button type="button" class="btn ghost" data-action="family-vault" data-member-id="${escapeHTML(m.id)}">${I('folder',15)} ${t('familyVault')}</button></div></article>`).join('')}</div>`}
        <div class="notice warning">${t('familyNoPublic')}</div></section>`;
    }
    const member=state.familyMode==='new'?familyBlank():familyMember(state.familySelectedId);
    if(!member)return `<div class="surface"><p>${t('familyLoadError')}</p>${back}</div>`;
    const fields=member.fields||familyBlank().fields;
    const relationship=member.relationship||'child';const authority=member.authority_basis||'legal_guardian';
    return `<section class="stack family-stack"><div class="page-intro"><h2>${state.familyMode==='new'?t('familyAdd'):t('familyEdit')}</h2><p>${t('familyIntro')}</p></div>${back}
      <div class="notice warning">${I('alert',16)} ${t('familyConsentNote')}</div>
      <form id="family-form" class="stack med-profile-form">
      <div class="surface"><div class="form-grid">
        <div class="field"><label for="family-relationship">${t('familyRelation')}</label><select required id="family-relationship" class="input" name="familyRelationship">${FAMILY_RELATIONS.map(k=>`<option value="${k}" ${relationship===k?'selected':''}>${escapeHTML(labels[k])}</option>`).join('')}</select></div>
        <div class="field"><label for="family-authority">${t('familyBasis')}</label><select required id="family-authority" class="input" name="familyAuthority"><option value="legal_guardian" ${authority==='legal_guardian'?'selected':''}>${t('familyGuardian')}</option><option value="express_consent" ${authority==='express_consent'?'selected':''}>${t('familyConsent')}</option></select></div>
      </div></div>
      ${MED_GROUPS.map((group,i)=>`<section class="surface medical-section"><header class="medical-section-head"><div class="medical-section-icon">${I(group.icon,20)}</div><div class="medical-section-copy"><span class="medical-eyebrow">${String(i+1).padStart(2,'0')} / 06</span><h3>${escapeHTML(state.lang==='ar'?group.ar:group.en)}</h3><p>${escapeHTML(state.lang==='ar'?group.descAr:group.descEn)}</p></div></header><div class="form-grid">${group.keys.map(key=>renderField(FIELDS.find(f=>f.key===key),fields)).join('')}</div></section>`).join('')}
      <div class="surface"><label class="family-attestation"><input type="checkbox" name="familyAttest" required/><span>${t('familyAttestation')}</span></label></div>
      <div class="btn-group"><button type="submit" class="btn primary">${I('check',16)} ${t('familySave')}</button>${state.familyMode==='edit'?`<button type="button" class="btn ghost" data-action="family-vault" data-member-id="${escapeHTML(member.id)}">${t('familyVault')}</button><button type="button" class="btn danger" data-action="family-delete" data-member-id="${escapeHTML(member.id)}">${t('familyDelete')}</button>`:''}</div>
      </form></section>`;
  }

  function renderSharing(){return `<div class="page-intro"><h2>${t('privacyTitle')}</h2><p>${t('privacyDesc')}</p></div><section class="stack"><div class="notice warning">${I('alert',16)} ${t('sharedHint')}</div><form class="stack" id="sharing-form"><div class="surface"><div class="section-head"><h2>${t('publicView')}</h2>${statusBadge()}</div><div class="sharing-list">${FIELDS.map(f=>{const filled=String(state.profile.fields[f.key]||'').trim().length>0;return `<label class="share-row"><span><span class="name">${escapeHTML(L(f))}</span><span class="detail">${filled?escapeHTML(state.profile.fields[f.key]).slice(0,60):t('emptyDetail')}</span></span><span class="switch"><input type="checkbox" name="share-${f.key}" ${state.profile.sharing[f.key]?'checked':''} ${!filled?'disabled':''} aria-label="${escapeHTML(L(f))}"/><span class="track"></span></span></label>`;}).join('')}</div></div><div class="btn-group"><button type="submit" class="btn primary" ${!state.profile.card_token?'disabled':''}>${I('shield',16)} ${state.profile.published?t('update'):t('publish')}</button>${state.profile.published?`<button class="btn danger" type="button" data-action="unpublish">${t('stop')}</button>`:''}<button class="btn ghost" type="button" data-tab="${state.profile.card_token?'card':'profile'}">${state.profile.card_token?t('yourCard'):t('fillProfile')}</button></div>${!state.profile.card_token?`<div class="notice warning">${t('mustCard')}</div>`:''}</form></section>`;}
  function qrSVG(url){try{const q=window.VitalQR(url);const n=q.getModuleCount();let cells='';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))cells+=`<rect x="${c+4}" y="${r+4}" width="1" height="1"/>`;return `<svg role="img" aria-label="QR code" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+8} ${n+8}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><g fill="#092f39">${cells}</g></svg>`;}catch(e){return `<div class="notice error">QR unavailable: ${escapeHTML(e.message)}</div>`;}}
  // Medical Vault: private object storage, random paths, owner-only metadata.
  const VAULT_BUCKET='vital-medical-vault';
  const VAULT_MAX_BYTES=10*1024*1024;
  const VAULT_MIMES={
    'application/pdf':'pdf', 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp'
  };
  const VAULT_CATEGORIES=['lab','imaging','prescription','report','other'];
  function vaultCategories(){return {lab:t('vaultLab'),imaging:t('vaultImaging'),prescription:t('vaultPrescription'),report:t('vaultReport'),other:t('vaultOther')};}
  function clearVaultPreview(){if(state.previewUrl){URL.revokeObjectURL(state.previewUrl);state.previewUrl=null;}}
  function resetVault(){clearVaultPreview();state.documents=[];state.vaultLoaded=false;state.vaultError=false;state.vaultFilter='all';state.vaultProfileId=null;}
  function resetFamily(){state.familyProfiles=[];state.familyLoaded=false;state.familyError=false;state.familyMode='list';state.familySelectedId=null;}
  function storagePath(path){return path.split('/').map(encodeURIComponent).join('/');}
  async function storageRequest(method, path, file=null){
    if(!state.session?.access_token||!state.user?.id)throw Error('Please sign in again.');
    if(state.session.expires_at<Date.now()+30000)await refresh();
    const headers={apikey:config.publishableKey, Authorization:'Bearer '+state.session.access_token};
    if(file){headers['Content-Type']=file.type;headers['x-upsert']='false';}
    const response=await fetch(base+'/storage/v1/object/'+path,{
      method,headers,body:file||undefined,cache:'no-store',referrerPolicy:'no-referrer'
    });
    // The object may already be gone if a prior DELETE succeeded but deleting metadata failed.
    if(method==='DELETE'&&response.status===404)return null;
    if(!response.ok){
      const txt=await response.text();let detail;
      try{const d=JSON.parse(txt);detail=d.message||d.error||d.msg;}catch{}
      throw Error(detail||`Storage request failed (${response.status})`);
    }
    return method==='GET'?response.blob():null;
  }
  async function loadVaultDocuments(){
    try{
      const userId=encodeURIComponent(state.user.id);
      const docs=await request('/rest/v1/medical_documents?select=id,title,category,document_date,mime_type,file_size,storage_path,family_profile_id,created_at&user_id=eq.'+userId+'&order=created_at.desc&limit=100',{auth:true});
      state.documents=Array.isArray(docs)?docs:[];
      state.vaultLoaded=true;state.vaultError=false;
    }catch(err){state.vaultLoaded=true;state.vaultError=true;throw err;}
  }
  function vaultDocument(id){return state.documents.find(d=>d.id===id);}
  function vaultFileSize(n){return Number.isFinite(n)?((n/1024/1024)<1?Math.ceil(n/1024)+' KB':(n/1024/1024).toFixed(1)+' MB'):'';}
  function renderVault(){
    const labels=vaultCategories();
    const visible=state.documents.filter(d=>(state.vaultProfileId?d.family_profile_id===state.vaultProfileId:!d.family_profile_id)&&(state.vaultFilter==='all'||d.category===state.vaultFilter));
    const categories=`<option value="all">${t('vaultAll')}</option>`+VAULT_CATEGORIES.map(c=>`<option value="${c}" ${state.vaultFilter===c?'selected':''}>${labels[c]}</option>`).join('');
    const scopeMember=state.vaultProfileId?familyMember(state.vaultProfileId):null;
    return `<div class="page-intro"><h2>${scopeMember?escapeHTML(t('familyDocsFor')+' '+(scopeMember.fields?.fullName||'')):t('vaultTitle')}</h2><p>${scopeMember?t('familyPrivate'):t('vaultIntro')}</p></div><section class="stack vault-stack">${scopeMember?`<button type="button" class="btn ghost" data-tab="family">${t('familyBack')}</button>`:''}
      <div class="notice">${I('lock',17)} ${t('vaultPrivate')}</div>
      <form id="vault-upload-form" class="surface vault-form">
        <div class="section-head"><h2>${I('folder',19)} ${t('vaultUpload')}</h2></div>
        <div class="form-grid">
          <div class="field wide"><label for="vault-title">${t('vaultDocTitle')}</label><input required maxlength="120" class="input" id="vault-title" name="vaultTitle" autocomplete="off" /></div>
          <div class="field"><label for="vault-category">${t('vaultType')}</label><select class="input" id="vault-category" name="vaultCategory" required>${VAULT_CATEGORIES.map(c=>`<option value="${c}">${labels[c]}</option>`).join('')}</select></div>
          <div class="field"><label for="vault-date">${t('vaultDate')}</label><input class="input" id="vault-date" name="vaultDate" type="date" /></div>
          <div class="field wide"><label for="vault-file">${t('vaultFile')}</label><input class="input vault-file-input" id="vault-file" name="vaultFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" required /><small class="helper">${t('vaultMax')}</small></div>
        </div><button class="btn primary" type="submit">${I('plus',16)} ${t('vaultSave')}</button>
      </form>
      <div class="surface vault-documents"><div class="section-head"><h2>${t('vaultTitle')}</h2><select class="input vault-filter" id="vault-filter" aria-label="${t('vaultType')}">${categories}</select></div>
      ${!state.vaultLoaded?`<p class="small">${t('vaultLoading')}</p>`:state.vaultError?`<div class="empty"><p>${t('vaultLoadFailed')}</p><button type="button" class="btn ghost" data-action="vault-retry">${t('vaultRetry')}</button></div>`:visible.length===0?`<div class="empty">${I('folder',35)}<strong>${t('vaultEmpty')}</strong><p>${t('vaultEmptyDesc')}</p></div>`:`<div class="vault-doc-list">${visible.map(d=>`<article class="vault-doc"><div class="vault-doc-icon">${I('folder',20)}</div><div class="vault-doc-body"><strong>${escapeHTML(d.title)}</strong><div class="vault-doc-meta">${escapeHTML(labels[d.category]||t('vaultOther'))} · ${vaultFileSize(d.file_size)}${d.document_date?' · '+escapeHTML(d.document_date):''}</div></div><div class="vault-doc-actions"><button type="button" class="btn ghost" data-action="vault-preview" data-doc-id="${escapeHTML(d.id)}">${t('vaultView')}</button><button type="button" class="btn ghost" data-action="vault-download" data-doc-id="${escapeHTML(d.id)}">${t('vaultDownload')}</button><button type="button" class="btn danger" data-action="vault-delete" data-doc-id="${escapeHTML(d.id)}">${t('vaultDelete')}</button></div></article>`).join('')}</div>`}
      </div>
    </section>`;
  }
  async function uploadVaultDocument(form){
    const fd=new FormData(form);
    const title=String(fd.get('vaultTitle')||'').trim();
    const category=String(fd.get('vaultCategory')||'');
    const date=String(fd.get('vaultDate')||'');
    const file=fd.get('vaultFile');
    if(!title||title.length>120||!VAULT_CATEGORIES.includes(category)||!state.user?.id)throw Error(t('vaultInvalid'));
    if(!(file instanceof File)||!file.size||file.size>VAULT_MAX_BYTES||!VAULT_MIMES[file.type])throw Error(t('vaultInvalid'));
    if(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error(t('vaultInvalid'));
    if(state.vaultProfileId&&!familyMember(state.vaultProfileId))throw Error(t('familyLoadError'));
    const id=crypto.randomUUID();
    const path=state.user.id+'/'+id+'.'+VAULT_MIMES[file.type];
    const remote=VAULT_BUCKET+'/'+storagePath(path);
    await storageRequest('POST',remote,file);
    try{
      await request('/rest/v1/medical_documents',{method:'POST',auth:true,body:{
        id,user_id:state.user.id,title,category,document_date:date||null,
        mime_type:file.type,file_size:file.size,storage_path:path,family_profile_id:state.vaultProfileId||null
      }});
    }catch(err){
      // Best effort removal to avoid leaving an orphan file after metadata failure.
      try{await storageRequest('DELETE',remote);}catch(cleanupErr){console.warn('Orphan cleanup failed',cleanupErr);}
      throw err;
    }
    await loadVaultDocuments();
  }
  async function downloadVaultBlob(doc){
    if(!doc||!state.user?.id||!doc.storage_path.startsWith(state.user.id+'/'))throw Error('Invalid document');
    const blob=await storageRequest('GET','authenticated/'+VAULT_BUCKET+'/'+storagePath(doc.storage_path));
    return new Blob([blob],{type:doc.mime_type});
  }
  // iOS Safari/PWA may show a blank page when a PDF blob is embedded in an iframe.
  // Sign a short-lived Storage URL only after the owner requests a PDF or image preview.
  // This temporary link must never be inserted in a QR or emergency/public record.
  async function getVaultSignedPreviewUrl(doc){
    if(!doc||!state.user?.id||!(['application/pdf','image/jpeg','image/png','image/webp'].includes(doc.mime_type))||!doc.storage_path.startsWith(state.user.id+'/'))
      throw Error('Invalid document');
    if(!state.session?.access_token)throw Error('Please sign in again.');
    if(state.session.expires_at<Date.now()+30000)await refresh();
    const response=await fetch(base+'/storage/v1/object/sign/'+VAULT_BUCKET+'/'+storagePath(doc.storage_path),{
      method:'POST',
      headers:{apikey:config.publishableKey,Authorization:'Bearer '+state.session.access_token,'Content-Type':'application/json'},
      body:JSON.stringify({expiresIn:120}),cache:'no-store',referrerPolicy:'no-referrer'
    });
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw Error(data?.message||data?.error||`Document preview failed (${response.status})`);
    const relative=String(data?.signedURL||'');
    if(!relative.startsWith('/object/sign/'+VAULT_BUCKET+'/')||!relative.includes('?token='))
      throw Error('Invalid signed preview link');
    return base+'/storage/v1'+relative;
  }
  async function showVaultPreview(doc){
    clearVaultPreview();
    let contents;
    if(doc.mime_type==='application/pdf'){
      const signedUrl=await getVaultSignedPreviewUrl(doc);
      // A direct click (rather than an auto-open after async network work) avoids iOS popup blocking.
      contents=`<div class="vault-pdf-fallback"><div class="vault-pdf-symbol">PDF</div><p>${t('vaultPdfHelp')}</p><a class="btn primary" href="${escapeHTML(signedUrl)}" target="_blank" rel="noopener noreferrer">${t('vaultOpenPdf')}</a></div>`;
    }else{
      // Private signed Storage URL works on iOS Safari/PWA where blob: <img> may render blank.
      // Link is created only for the authenticated owner, valid for 120 seconds, and never published in QR.
      const signedUrl=await getVaultSignedPreviewUrl(doc);
      contents=`<div class="vault-image-preview"><p class="vault-image-status" role="status">${t('vaultImageLoading')}</p><img class="vault-preview-image" src="${escapeHTML(signedUrl)}" alt="${escapeHTML(doc.title)}" referrerpolicy="no-referrer" /><a class="btn ghost vault-image-open" href="${escapeHTML(signedUrl)}" target="_blank" rel="noopener noreferrer">${t('vaultOpenImage')}</a></div>`;
    }
    const modal=document.createElement('div');
    modal.className='vault-overlay';modal.id='vault-overlay';
    modal.innerHTML=`<div class="vault-modal" role="dialog" aria-modal="true" aria-label="${t('vaultPreview')}"><div class="vault-modal-head"><strong>${escapeHTML(doc.title)}</strong><button class="btn ghost" type="button" data-action="vault-preview-close">${t('vaultClose')}</button></div><div class="vault-modal-content">${contents}</div></div>`;
    root.appendChild(modal);
    const image=modal.querySelector('.vault-preview-image');
    if(image){
      const status=modal.querySelector('.vault-image-status');
      image.addEventListener('load',()=>{if(status)status.textContent='';});
      image.addEventListener('error',()=>{
        if(status)status.textContent=t('vaultImageError');
        image.style.display='none';
      });
      if(image.complete&&image.naturalWidth>0&&status)status.textContent='';
    }
  }
  async function downloadVaultDocument(doc){
    const blob=await downloadVaultBlob(doc);
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    const ext=VAULT_MIMES[doc.mime_type]||'bin';
    a.download='VITAL-'+doc.id+'.'+ext;a.style.display='none';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),20000);
  }
  async function deleteVaultDocument(doc){
    if(!confirm(t('vaultConfirmDelete')))return false;
    await storageRequest('DELETE',VAULT_BUCKET+'/'+storagePath(doc.storage_path));
    await request('/rest/v1/medical_documents?id=eq.'+encodeURIComponent(doc.id),{method:'DELETE',auth:true});
    await loadVaultDocuments();
    return true;
  }
  function renderCard(){const url=emergencyUrl();return `<div class="page-intro"><h2>${t('cardTitle')}</h2><p>${t('cardDesc')}</p></div><section class="stack"><div class="surface"><div class="section-head"><h2>${t('yourCard')}</h2>${statusBadge()}</div>${url?`<div style="text-align:center"><div class="qr-container">${qrSVG(url)}</div><div class="url-text">${escapeHTML(url)}</div></div><div class="btn-group" style="justify-content:center;margin-top:20px"><button class="btn primary" data-action="copy">${I('copy',16)} ${t('copy')}</button><a class="btn ghost" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${I('globe',16)} ${t('open')}</a></div><div class="btn-group" style="justify-content:center;margin-top:12px">${state.profile.published?`<button type="button" class="btn danger" data-action="unpublish">${I('lock',16)} ${t('stop')}</button>`:countShared()>0?`<button type="button" class="btn primary" data-action="resume-publish">${I('shield',16)} ${t('resumeCard')}</button>`:`<button type="button" class="btn ghost" data-tab="sharing">${t('configureSharing')}</button>`}</div>`:`<div class="empty">${I('credit',40)}<strong>${t('cardNotCreated')}</strong><p>${t('cardHint')}</p><button class="btn primary" data-action="create-card">${I('plus',16)} ${t('makeCard')}</button></div>`}</div><div class="notice warning">${I('alert',16)} ${t('sharedHint')}</div></section>`;}
  function renderApp(){setLang(state.lang);const titles={home:t('home'),profile:t('profile'),vault:t('vault'),family:t('family'),sharing:t('sharing'),card:t('card')};const nav=()=>[navButton('home',t('home'),'home'),navButton('profile',t('profile'),'user'),navButton('vault',t('vault'),'folder'),navButton('family',t('family'),'user'),navButton('sharing',t('sharing'),'shield'),navButton('card',t('card'),'credit')].join('');root.innerHTML=`<div class="app-shell"><aside class="sidebar"><div class="brand"><img src="/assets/icon.svg" alt=""/><div>VITAL<small>MEDICAL IDENTITY</small></div></div><nav class="menu" aria-label="Navigation">${nav()}</nav><div class="sidebar-note"><div class="tiny">SECURE MEDICAL IDENTITY</div><strong>Your information. Your choice.</strong><p>${t('sharedHint')}</p></div></aside><main class="main"><header class="top"><div><div class="eyebrow">VITAL / ${escapeHTML(titles[state.tab])}</div><h1>${escapeHTML(titles[state.tab])}</h1></div><div class="top-actions"><button class="square-btn" data-action="toggle-lang" aria-label="Switch language">${t('language')}</button><button class="square-btn" data-action="logout" title="${t('logout')}" aria-label="${t('logout')}">${I('exit',18)}</button><div class="avatar">${userInitial()}</div></div></header>${state.tab==='home'?renderHome():state.tab==='profile'?renderProfile():state.tab==='vault'?renderVault():state.tab==='family'?renderFamily():state.tab==='sharing'?renderSharing():renderCard()}</main><nav class="mobile-nav" aria-label="Mobile navigation">${nav()}</nav></div>`;}
  function render(){clearVaultPreview();if(!configured){renderSetup();return;}if(!state.user){renderAuth();return;}renderApp();}
  function emergencyField(f,value){return `<div class="emergency-field ${f.key==='allergies'?'emergency-alert':''}"><span class="emergency-field-title">${escapeHTML(L(f))}</span><div class="emergency-value">${escapeHTML(value)}</div>${f.key==='contactPhone'&&/^[+\d\s()\-]{4,24}$/.test(value)?`<a class="emergency-call" href="tel:${escapeHTML(value.replace(/[^+\d]/g,''))}">${I('phone',16)} ${t('call')}</a>`:''}</div>`;}
  async function renderEmergency(token){setLang(state.lang);root.innerHTML=`<div class="emergency-wrap"><div class="emergency"><header class="emergency-head"><div class="brand"><img src="/assets/icon.svg" alt=""/> VITAL</div><button data-action="toggle-lang" type="button">${I('globe',14)} ${t('language')}</button></header><article class="emergency-body"><div class="emergency-status"><div>${I('pulse',35)}</div><strong>${t('loading')}</strong></div></article></div></div>`;let snapshot=null;let errored=false;try{snapshot=await loadEmergency(token);}catch(e){errored=true;console.error('Emergency retrieval failed',e);}const body=root.querySelector('.emergency-body');if(!body)return;if(errored){body.innerHTML=`<div class="emergency-status">${I('alert',32)}<strong>${state.lang==='ar'?'تعذّر الاتصال بالخدمة':'Unable to connect'}</strong><p>${state.lang==='ar'?'حاول إعادة فتح الصفحة. لا يمكن الاعتماد على معلومات غير متاحة.':'Please retry; no medical data is currently available.'}</p><button class="btn ghost" data-action="refresh-emergency">${state.lang==='ar'?'إعادة المحاولة':'Retry'}</button></div>`;return;}if(!snapshot||typeof snapshot!=='object'||!Object.values(snapshot).some(v=>typeof v==='string'&&v.trim())){body.innerHTML=`<div class="emergency-status">${I('lock',40)}<strong>${t('inactive')}</strong><p>${t('inactiveDesc')}</p></div>`;return;}const visible=FIELDS.filter(f=>typeof snapshot[f.key]==='string'&&snapshot[f.key].trim());body.innerHTML=`<span class="emergency-tag">VITAL • EMERGENCY MEDICAL ID</span><h1>${t('emergency')}</h1>${snapshot.fullName?`<div class="emergency-name">${escapeHTML(snapshot.fullName)}</div>`:''}<div class="notice warning">${I('alert',16)} ${t('emergencyWarning')}</div>${visible.filter(f=>f.key!=='fullName').sort((a,b)=>a.key==='allergies'?-1:b.key==='allergies'?1:0).map(f=>emergencyField(f,snapshot[f.key])).join('')}<p class="footnote">${t('powered')}</p>`;}
  function isEmergency(){return /^\/e\//.test(location.pathname);}
  root.addEventListener('click',async(e)=>{const control=e.target.closest('[data-tab],[data-action]');if(!control||state.busy)return;const tab=control.dataset.tab,action=control.dataset.action;if(tab){clearVaultPreview();if(tab==='vault')state.vaultProfileId=null;if(tab==='family'){state.familyMode='list';state.familySelectedId=null;}state.tab=tab;render();scrollTo({top:0,behavior:'smooth'});if(tab==='family'&&!state.familyLoaded){try{await loadFamilyProfiles();render();}catch(err){notify(t('familyLoadError'));render();}}if(tab==='vault'&&!state.vaultLoaded){try{await loadVaultDocuments();render();}catch(err){notify(t('vaultLoadFailed'));render();}}return;}if(action==='vault-preview-close'){root.querySelector('#vault-overlay')?.remove();clearVaultPreview();return;}

    if(action==='family-new'){state.familyMode='new';state.familySelectedId=null;state.tab='family';render();return;}
    if(action==='family-back'){state.familyMode='list';state.familySelectedId=null;state.tab='family';render();return;}
    if(action==='family-edit'){
      const member=familyMember(control.dataset.memberId);if(!member)return;
      state.familyMode='edit';state.familySelectedId=member.id;state.tab='family';render();return;
    }
    if(action==='family-reload'){try{state.familyLoaded=false;render();await loadFamilyProfiles();render();}catch(err){notify(t('familyLoadError'));render();}return;}
    if(action==='family-vault'){
      const member=familyMember(control.dataset.memberId);if(!member)return;
      state.vaultProfileId=member.id;state.tab='vault';state.vaultFilter='all';
      state.vaultLoaded=false;render();
      try{await loadVaultDocuments();render();}catch(err){notify(t('vaultLoadFailed'));render();}
      return;
    }
    if(action==='family-delete'){
      const member=familyMember(control.dataset.memberId);if(!member)return;
      state.busy=true;
      try{if(await deleteFamilyMember(member)){render();notify(t('familyRemoved'));}}catch(err){notify(err.message||t('familyLoadError'));}
      finally{state.busy=false;}return;
    }
    if(action==='vault-retry'){state.busy=true;try{state.vaultLoaded=false;render();await loadVaultDocuments();render();}catch(err){render();notify(t('vaultLoadFailed'));}finally{state.busy=false;}return;}
    if(['vault-preview','vault-download','vault-delete'].includes(action)){
      const doc=vaultDocument(control.dataset.docId);
      if(!doc)return;
      state.busy=true;
      try{
        if(action==='vault-preview')await showVaultPreview(doc);
        if(action==='vault-download')await downloadVaultDocument(doc);
        if(action==='vault-delete'&&await deleteVaultDocument(doc)){render();notify(t('vaultDeleted'));}
      }catch(err){notify(err.message||t('vaultLoadFailed'));}
      finally{state.busy=false;}
      return;
    }
    if(action==='add-med-entry'){
      const key=control.dataset.medKey;
      const f=FIELDS.find(x=>x.key===key&&x.kind==='list');
      const container=f?root.querySelector(`[data-med-list="${key}"]`):null;
      if(!container)return;
      const list=container.querySelector('.med-entry-list');
      if(list.children.length>=30){notify(t('maxEntries'));return;}
      list.insertAdjacentHTML('beforeend',medicalEntryMarkup(f,'',list.children.length+1));
      list.lastElementChild.querySelector('[data-med-entry]')?.focus();
      return;
    }
    if(action==='remove-med-entry'){
      const item=control.closest('.med-entry');
      const list=item?.parentElement;
      item?.remove();
      if(list){[...list.querySelectorAll('.med-entry')].forEach((el,i)=>{
        const num=el.querySelector('.med-entry-num');
        if(num)num.textContent=String(i+1).padStart(2,'0');
      });}
      return;
    }
    if(action==='toggle-lang'){setLang(state.lang==='ar'?'en':'ar');if(isEmergency())await renderEmergency(routeEmergency()||'');else render();return;}if(action==='switch-auth'){state.mode=state.mode==='signin'?'signup':'signin';render();return;}if(action==='logout'){try{await request('/auth/v1/logout?scope=local',{method:'POST',auth:true});}catch(e){console.warn('Remote logout failed',e);}state.user=null;state.session=null;state.profile=blankProfile();resetVault();resetFamily();sessionStorage.removeItem('vital_session');render();return;}if(action==='create-card'){state.busy=true;try{await createCard();render();notify(t('created'));}catch(err){notify(err.message);}finally{state.busy=false;}return;}if(action==='copy'){try{await navigator.clipboard.writeText(emergencyUrl());notify(t('copied'));}catch{notify('Clipboard unavailable');}return;}if(action==='resume-publish'){if(!state.profile.card_token||countShared()===0){notify(t('mustChoose'));return;}if(!confirm(t('confirmResume')))return;state.busy=true;try{await saveProfile(true);render();notify(t('resumeSuccess'));}catch(err){notify(err.message);}finally{state.busy=false;}return;}if(action==='unpublish'){if(!confirm(t('confirmStop')))return;state.busy=true;try{await saveProfile(false);render();notify(t('stopSuccess'));}catch(err){notify(err.message);}finally{state.busy=false;}return;}if(action==='refresh-emergency'){await renderEmergency(routeEmergency()||'');return;}});
  root.addEventListener('submit',async(e)=>{e.preventDefault();if(state.busy)return;state.busy=true;const form=e.target;const button=form.querySelector('[type="submit"]');if(button)button.disabled=true;try{if(form.id==='family-form'){await saveFamilyMember(form);render();notify(t('familySaved'));}else if(form.id==='vault-upload-form'){await uploadVaultDocument(form);render();notify(t('vaultSaved'));}else if(form.id==='auth-form'){const data=new FormData(form);await authenticate(String(data.get('email')||'').trim(),String(data.get('password')||''),state.mode==='signup');}else if(form.id==='profile-form'){const fields=getFieldsFromForm();await saveProfile(state.profile.published,fields,state.profile.sharing);render();notify(t('saved'));}else if(form.id==='sharing-form'){if(!state.profile.card_token)throw Error(t('mustCard'));const sharing=getSharingFromForm();if(!FIELDS.some(f=>sharing[f.key]&&state.profile.fields[f.key]?.trim()))throw Error(t('mustChoose'));if(!confirm(t('confirmPublish')))return;await saveProfile(true,state.profile.fields,sharing);render();notify(t('publishSuccess'));}}catch(err){notify(err.message||'Something went wrong');}finally{state.busy=false;if(button?.isConnected)button.disabled=false;}});
  root.addEventListener('change',(e)=>{if(e.target.id==='vault-filter'){state.vaultFilter=e.target.value;render();}});
  root.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&state.previewUrl){root.querySelector('#vault-overlay')?.remove();clearVaultPreview();}});
  async function init(){setLang(state.lang);if(isEmergency()){const token=routeEmergency();if(!token){root.innerHTML=`<div class="emergency-wrap"><div class="emergency-status"><strong>${t('inactive')}</strong></div></div>`;return;}if(!validConfig())return;await renderEmergency(token);return;}if(!validConfig())return;try{const stored=sessionStorage.getItem('vital_session');if(stored){state.session=JSON.parse(stored);await refresh();await afterLogin();return;}}catch(err){console.warn('Session restore failed',err);state.session=null;state.user=null;sessionStorage.removeItem('vital_session');}render();}
  if('serviceWorker' in navigator && window.isSecureContext)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  init();
})();
