export const layouts={list:'قائمة صندوقية عمودية',process:'معالجة',hierarchy:'هيكلي',pyramid:'هرمي'}
export function diagramElement(model){
  const figure=document.createElement('figure')
  const layout=Object.hasOwn(layouts,model.layout)?model.layout:'list'
  figure.dataset.diagram=layout;figure.setAttribute('aria-label',layouts[layout])
  const color=/^#[0-9a-f]{6}$/i.test(model.color)?model.color:'#bee6db'
  figure.dataset.color=color
  const items=model.items.slice(0,24)
  figure.style.cssText='display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.4rem;margin:1rem auto'
  figure.style.flexDirection=layout==='process'?'row':'column'
  items.forEach((text,i)=>{
    const box=document.createElement('div');box.dataset.item='';box.textContent=text
    box.style.cssText='box-sizing:border-box;text-align:center;padding:.45rem;border:1px solid #536970;color:#172b38;min-height:2em;overflow-wrap:anywhere'
    box.style.backgroundColor=color
    box.style.width=layout==='process'?'auto':layout==='pyramid'?((i+1)/items.length*75+20)+'%':layout==='hierarchy'?(i===0?'45%':'68%'):'85%'
    if(layout==='hierarchy')box.style.alignSelf=i===0?'center':'end'
    figure.append(box)
  })
  return figure
}
export function readDiagram(figure){
  return {type:'diagram',layout:figure.dataset.diagram,color:figure.dataset.color,items:Array.from(figure.querySelectorAll('[data-item]'),n=>n.textContent.slice(0,500))}
}
