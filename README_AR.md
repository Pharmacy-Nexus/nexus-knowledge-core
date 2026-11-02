# VITAL — Mobile Web App + Emergency Web (Supabase)

**دي نسخة PWA (تطبيق ويب قابل للإضافة للشاشة الرئيسية)، مش APK، ومش منشورة على الإنترنت حتى الآن.**

## بنينا إيه؟

- واجهات عربية وإنجليزية بتصميم Mobile First، قابلة للفتح على Android وiPhone.
- تسجيل/إنشاء حساب بالبريد وكلمة المرور عن طريق Supabase Auth.
- ملف طبي **فارغ بالكامل في البداية**؛ لا توجد أي أسماء أو تحاليل أو أدوية أو مرضى تجريبيين.
- حفظ البيانات الطبية الخاصة في `medical_profiles` بقواعد RLS.
- اختيار الحقول المسموح بمشاركتها وقت الطوارئ، وجميع الخيارات مغلقة افتراضيًا.
- إنشاء رابط خاص للكارت عشوائيًا (40 رمز hex = 160 bit)، وتوليد QR محليًا في المتصفح **من غير إرسال رابط الكارت لأي طرف ثالث**.
- صفحة ويب عامة على `/e/CARD_TOKEN` بتعرض **المعلومات المنشورة فقط** عن طريق Supabase RPC.
- زر إيقاف نشر الصفحة يمسح المحتوى المنشور من سجل الطوارئ في قاعدة البيانات.
- `manifest.webmanifest` وService Worker لتثبيت واجهة التطبيق على الشاشة الرئيسية؛ **لا يحتفظ Service Worker بأي بيانات طبية أو استجابات API**.

## المطلوب علشان يشتغل أونلاين

### 1) أنشئ Supabase Free

افتح https://supabase.com/dashboard وأنشئ مشروعًا **جديدًا**. بعد إنشاء المشروع افتح SQL Editor، والصق ملف:

`supabase/001_vital_schema.sql`

واضغط Run. **لا تشغّل SQL على قاعدة بيانات منتج قائم أو مشروع VITAL قديم.**

في Supabase Authentication → Providers فعّل Email. لو Confirm Email شغال، لازم تأكد بريدك قبل الدخول.

### 2) وصّل التطبيق

افتح `config.js` وبدّل القيمتين الفارغتين:

```javascript
window.VITAL_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "sb_publishable_YOUR_PUBLIC_KEY"
};
```

تقدر تستخدم `anon` public key القديم بدل الـpublishable key لو مشروعك لسه بيستخدمه.

**مهم:** الـPublishable/Anon key صُممت للاستخدام في واجهة المتصفح، لكن **لا تضع أبدًا `service_role` أو `secret` key** في الملف.

### 3) جرّب محليًا

```bash
cd VITAL-PWA-Supabase-v1
python -m http.server 8080
```

افتح `http://localhost:8080` — ده للتجربة على الكمبيوتر. صفحة الطوارئ والمسح من موبايل تاني يحتاجان رابط HTTPS منشورًا.

### 4) انشر كـStatic Website

ارفع **كل محتويات المجلد** إلى Cloudflare Pages كـStatic site. مفيش `npm install` أو build command.

ممكن ترفع المجلد Upload مباشرة في Cloudflare Pages (من Projects → Create project → Upload assets). أضف الملفات بما فيها `_redirects` و`_headers` و`sw.js` و`assets/`.

الرابط العام يبقى مثلًا `https://YOUR-SITE.pages.dev`.

افتحه على موبايلك، وسجّل حساب، وادخل بياناتك، ثم أنشئ كارت وانشر المعلومات التي تختارها. رابط `/e/<TOKEN>` يعرض فقط المنشور، من غير تسجيل دخول.

### 5) تثبيت على الشاشة الرئيسية

- **Android / Chrome:** قائمة المتصفح → Install app أو Add to Home screen.
- **iPhone / Safari:** Share → Add to Home Screen.

الـPWA عبارة عن موقع يُثبَّت كأيقونة، **مش تطبيق Native ولا APK**.

## ملاحظات الأمان قبل استخدام معلومات طبية حقيقية

- الرابط العام **مش خاص**: أي شخص معه الكارت أو QR أو صورة الرابط يقدر يشوف المعلومات المنشورة.
- لا تدخل بيانات طبية حقيقية قبل إجراء اختبارين على الأقل: حساب A لا يقرأ ملف حساب B، وإيقاف النشر يخفي صفحة الطوارئ فورًا. ويفضل مراجعة أمان مستقلة قبل الاستخدام الواقعي.
- البيانات اللي تدخلها هنا ممكن تكون حساسة جدًا؛ تأكد من إعدادات الاستضافة والخصوصية وحماية الحساب.
- متصفحات الهاتف تختلف في إمكانيات التثبيت؛ Service Worker بيخزّن ملفات الواجهة فقط. بيانات الطوارئ تحتاج إنترنت ولا تتخزن للعمل أوفلاين.
- Supabase Free قد يُوقف المشاريع الخاملة؛ لا تعتمد على الديمو كخدمة طوارئ حرجة للمستخدمين.
- هذه النسخة لا تتضمن إدارة عدة أفراد أو رفع ملفات وتقارير طبية. يتم إضافتها لاحقًا بعد تحقق الربط الأساسي.

## المكونات

```
index.html                   App shell + emergency route
app.js                       UI + logic + calls to Supabase REST/RPC
styles.css                   Responsive premium mobile UI
config.js                    Public Supabase configuration (fill this)
qr-local.js                  Local QR code generator
sw.js                        Cache only static app shell
manifest.webmanifest         PWA metadata
supabase/001_vital_schema.sql  SQL + RLS + RPC
assets/                      VITAL icon assets
_headers                     Cloudflare Pages security headers
_redirects                   Cloudflare emergency SPA route
```

## الاختبارات المحلية

- `node --check app.js` و`node --check qr-local.js`.
- Playwright browser checks on configuration screen, login screen, form controls, and QR encoder (see `tests/`).
- **لم نتحقق من الاتصال الحقيقي بقاعدة Supabase ولا نشر Cloudflare لأن الدخول لحسابك غير متصل هنا**. نتيجة اختبار واجهات لا تعني أن النظام جاهز لاستخدام بيانات طبية حساسة.
