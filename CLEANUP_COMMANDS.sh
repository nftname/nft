#!/bin/bash
# 🧹 سكريبت تنظيف الموقع - NNM NFT Platform
# تاريخ الإنشاء: 21 ديسمبر 2025

echo "🧹 بدء عملية التنظيف..."
echo ""

# ✅ الخطوة 1: حذف ملفات التوثيق الزائدة
echo "📝 الخطوة 1: حذف ملفات التوثيق الزائدة..."
rm -f AUDIT_REPORT.md
rm -f PRODUCTION_AUDIT.md
rm -f PRODUCTION_AUDIT_FINAL.md
rm -f FONT_INTEGRATION_REPORT.md
rm -f FONT_PATH_ANALYSIS.md
rm -f MONOREPO_FONT_FIX.md
rm -f FIX_REPORT_ROUTE_ERRORS.md
rm -f PROJECT_TRANSFORMATION_REPORT.md
rm -f SETUP_COMPLETE.md
rm -f PRODUCTION_CHECK.txt
echo "✅ تم حذف ملفات التوثيق الزائدة"
echo ""

# ✅ الخطوة 2: حذف ملفات البناء المؤقتة
echo "🔧 الخطوة 2: حذف ملفات البناء المؤقتة..."
rm -rf packages/hardhat/artifacts/
rm -rf packages/hardhat/cache/
rm -rf packages/nextjs/.next/
echo "✅ تم حذف ملفات البناء المؤقتة"
echo ""

# ✅ الخطوة 3: تنظيف node_modules (اختياري - يستغرق وقتاً)
echo "📦 الخطوة 3: تنظيف node_modules (اختياري)..."
read -p "هل تريد تنظيف node_modules؟ (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "⏳ جاري التنظيف..."
    yarn autoclean --init
    yarn autoclean --force
    echo "✅ تم تنظيف node_modules"
else
    echo "⏭️ تم تخطي تنظيف node_modules"
fi
echo ""

# ✅ الخطوة 4: إعادة بناء المشروع
echo "🔨 الخطوة 4: إعادة بناء المشروع..."
read -p "هل تريد إعادة بناء المشروع الآن؟ (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "⏳ جاري البناء..."
    yarn hardhat:compile
    yarn next:build
    echo "✅ تم إعادة البناء"
else
    echo "⏭️ تم تخطي إعادة البناء"
fi
echo ""

# ✅ الخطوة 5: التحقق من .gitignore
echo "🔍 الخطوة 5: التحقق من .gitignore..."
if [ -f .gitignore ]; then
    echo "✅ ملف .gitignore موجود"
    
    # التحقق من وجود الإدخالات المهمة
    if ! grep -q "^artifacts/" .gitignore; then
        echo "⚠️ إضافة artifacts/ إلى .gitignore..."
        echo "artifacts/" >> .gitignore
    fi
    
    if ! grep -q "^cache/" .gitignore; then
        echo "⚠️ إضافة cache/ إلى .gitignore..."
        echo "cache/" >> .gitignore
    fi
    
    if ! grep -q "^.next/" .gitignore; then
        echo "⚠️ إضافة .next/ إلى .gitignore..."
        echo ".next/" >> .gitignore
    fi
    
    if ! grep -q "^.env" .gitignore; then
        echo "⚠️ إضافة .env* إلى .gitignore..."
        echo ".env*" >> .gitignore
        echo "!.env.example" >> .gitignore
    fi
    
    echo "✅ تم التحقق من .gitignore"
else
    echo "⚠️ ملف .gitignore غير موجود - سيتم إنشاؤه..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Hardhat
artifacts/
cache/
deployments/localhost/

# Environment
.env
.env*.local
.env.production

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Secrets
*.pem
*.key
EOF
    echo "✅ تم إنشاء .gitignore"
fi
echo ""

# ✅ الخطوة 6: عرض إحصائيات التنظيف
echo "📊 إحصائيات ما بعد التنظيف:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# حساب عدد الملفات
file_count=$(find . -type f -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/artifacts/*" | wc -l)
echo "📄 عدد الملفات: $file_count"

# حساب حجم المشروع (بدون node_modules)
project_size=$(du -sh --exclude=node_modules --exclude=.next --exclude=artifacts . 2>/dev/null | cut -f1)
echo "💾 حجم المشروع: $project_size"

# عد ملفات .md المتبقية
md_count=$(find . -type f -name "*.md" -not -path "*/node_modules/*" | wc -l)
echo "📚 ملفات التوثيق المتبقية: $md_count"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "✅ اكتمل التنظيف بنجاح!"
echo ""
echo "📝 الخطوات التالية:"
echo "   1. راجع الملفات المحذوفة"
echo "   2. اختبر الموقع: yarn start"
echo "   3. تأكد من عمل كل شيء بشكل صحيح"
echo "   4. قم بعمل commit للتغييرات"
echo ""
echo "🎉 شكراً لاستخدام NNM NFT Platform!"
