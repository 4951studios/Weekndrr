import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const base='http://127.0.0.1:5173/'; const out='assets/store-screenshots'; await mkdir(out,{recursive:true});
const platforms=[['ios',430,932,3],['android',360,640,3]];
async function ready(page){await page.goto(base,{waitUntil:'domcontentloaded'}); const l=page.locator('[aria-label="Loading Weekndrr"]'); try{await l.waitFor({state:'hidden',timeout:15000});}catch{} await page.waitForTimeout(1200); if(!(await page.locator('body').innerText()).includes('Weekndrr')) throw Error('Weekndrr missing');}
async function clickText(page,re){const x=page.getByText(re,{exact:false}).first(); await x.waitFor({state:'visible',timeout:10000}); await x.click(); await page.waitForTimeout(600);}
for(const [p,w,h,dsf] of platforms){const browser=await chromium.launch(); const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:dsf,isMobile:true}); const page=await ctx.newPage();
 await ready(page); await page.screenshot({path:`${out}/${p}-01-explore.png`});
 await page.getByRole('button',{name:/filters/i}).click(); await page.waitForTimeout(500); await page.screenshot({path:`${out}/${p}-02-filters.png`});
 await ready(page); await page.getByRole('button',{name:/location|departure|city|austin|anywhere/i}).first().click(); await page.waitForTimeout(500); await page.screenshot({path:`${out}/${p}-03-location.png`});
 await ready(page); await clickText(page,/Joshua Tree/); await page.screenshot({path:`${out}/${p}-04-joshua-tree.png`});
 await ready(page); await clickText(page,/Austin/); await page.screenshot({path:`${out}/${p}-05-austin.png`});
 await ready(page); await clickText(page,/Big Sur/); await page.screenshot({path:`${out}/${p}-06-big-sur.png`});
 await ready(page); await clickText(page,/Joshua Tree/); const book=page.getByRole('button',{name:/book|reserve|checkout|continue/i}).first(); await book.click(); await page.waitForTimeout(600); await page.screenshot({path:`${out}/${p}-07-checkout.png`});
 await ready(page); await page.getByRole('link',{name:/saved/i}).click(); await page.waitForTimeout(600); await page.screenshot({path:`${out}/${p}-08-saved.png`});
 await page.getByRole('link',{name:/profile/i}).click(); await page.waitForTimeout(600); await page.screenshot({path:`${out}/${p}-09-profile.png`});
 const sign=page.getByRole('link',{name:/sign in/i}).first(); if(await sign.count()) await sign.click(); else await page.getByRole('button',{name:/sign in/i}).first().click(); await page.waitForTimeout(500); await page.screenshot({path:`${out}/${p}-10-signin.png`});
 await ctx.close(); await browser.close(); }
