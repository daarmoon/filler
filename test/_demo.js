// v7부터 처음 화면이 비어 있어서, 예전 테스트는 예전 예시 입력(간편 입력 + 첫 예시)으로 시작하게 맞춤
module.exports = async function demo(page, opt = {}) {
  await page.evaluate(o => {
    showPane('quick');
    loadForm({ product: '마데카 크림', hook: '', price: '76090', pricePre: '단,', priceNote: '(모바일 10% 할인 시)', points: ['피부 장벽 강화', '끈적임 없는 흡수'], urgent: '', comps: [{ name: '크림 50ml', img: '상품1', qty: '10' }, { name: '방송 단독 1통 더', img: '상품1', qty: '1' }] });
    renderComps(); updateCalc();
    if (o.template !== false) setText(TEMPLATES[0].text);
  }, opt);
  await page.waitForTimeout(300);
};
