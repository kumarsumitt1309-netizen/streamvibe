// ================================================
// STREAMVIBE — plans.js
// PURPOSE: Demo payment and plan upgrade workflow
// ================================================

const PLAN_CONFIG = {
  bronze: { price: 10, label: "Bronze", watchMinutes: 7 },
  silver: { price: 50, label: "Silver", watchMinutes: 10 },
  gold:   { price: 100, label: "Gold", watchMinutes: Infinity },
};

let currentUser = null;
let userProfile = null;

window.addEventListener("DOMContentLoaded", async () => {
  currentUser = await requireAuth();
  if (!currentUser) return;

  try {
    userProfile = await getUserProfile(currentUser.uid);
    document.getElementById("user-plan-badge").textContent = (userProfile?.plan || "free").toUpperCase();
  } catch (err) {
    console.warn("Could not load profile:", err);
  }
});

async function purchasePlan(planKey) {
  const plan = PLAN_CONFIG[planKey];
  if (!plan) return;

  showToast(`Processing ${plan.label} plan payment...`, "default", 2500);

  setTimeout(async () => {
    try {
      await db.collection("users").doc(currentUser.uid).set({
        plan: planKey,
        upgradedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      userProfile = await getUserProfile(currentUser.uid);
      document.getElementById("user-plan-badge").textContent = planKey.toUpperCase();

      const invoice = generateInvoice(currentUser.email, planKey, plan.price);
      showInvoice(invoice);
      sendInvoiceEmail(currentUser.email, invoice);
    } catch (err) {
      console.error("Upgrade failed:", err);
      showToast("Could not complete upgrade. Try again.", "error");
    }
  }, 1500);
}

function generateInvoice(email, planKey, price) {
  const plan = PLAN_CONFIG[planKey];
  const now  = new Date();
  return {
    invoiceId: `SV-${now.getTime()}`,
    date: now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
    email,
    plan: plan.label,
    amount: `₹${price}.00`,
    watchLimit: plan.watchMinutes === Infinity ? "Unlimited" : `${plan.watchMinutes} minutes`,
  };
}

function showInvoice(invoice) {
  const box = document.getElementById("invoice-box");
  const text = document.getElementById("invoice-text");
  if (!box || !text) return;

  text.innerHTML = `
    <strong>Invoice:</strong> ${invoice.invoiceId}<br/>
    <strong>Date:</strong> ${invoice.date}<br/>
    <strong>Email:</strong> ${invoice.email}<br/>
    <strong>Plan:</strong> ${invoice.plan}<br/>
    <strong>Watch Limit:</strong> ${invoice.watchLimit}<br/>
    <strong>Paid:</strong> ${invoice.amount}
  `;
  box.classList.remove("hidden");
  showToast(`${invoice.plan} plan activated!`, "success", 4000);
}

function sendInvoiceEmail(email, invoice) {
  alert(`Invoice sent to ${email}:

Invoice ID: ${invoice.invoiceId}
Plan: ${invoice.plan}
Amount: ${invoice.amount}
Watch Limit: ${invoice.watchLimit}

(This is a demo email notification.)`);
}
