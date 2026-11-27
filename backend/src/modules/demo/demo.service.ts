import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DEMO_EMAILS, DEMO_PERSONA, DEMO_RULES, type DemoPersona } from './demo.constants';
import { seedDemo } from './demo-seed';

const HOUR_MS = 3_600_000;

async function isDemoFresh() {
  const seed = await prisma.demoSeed.findUnique({ where: { id: DEMO_RULES.SEED_ROW_ID } });
  return Boolean(
    seed && Date.now() - seed.seededAt.getTime() < DEMO_RULES.RESEED_AFTER_HOURS * HOUR_MS,
  );
}

export const demoService = {
  /** Signs a visitor in to a shared demo account, rebuilding the demo first if it is a day old. */
  async startSession(persona: DemoPersona) {
    const link = await supabaseAdmin.issueMagicLink(DEMO_EMAILS[persona]);

    if (!(await isDemoFresh())) {
      const other = persona === DEMO_PERSONA.FAMILY ? DEMO_PERSONA.CAREGIVER : DEMO_PERSONA.FAMILY;
      const otherLink = await supabaseAdmin.issueMagicLink(DEMO_EMAILS[other]);
      const ids = { [persona]: link.userId, [other]: otherLink.userId } as Record<
        DemoPersona,
        string
      >;
      await seedDemo(
        { familyId: ids[DEMO_PERSONA.FAMILY], caregiverId: ids[DEMO_PERSONA.CAREGIVER] },
        {
          family: DEMO_EMAILS[DEMO_PERSONA.FAMILY],
          caregiver: DEMO_EMAILS[DEMO_PERSONA.CAREGIVER],
        },
      );
    }

    return { email: DEMO_EMAILS[persona], tokenHash: link.tokenHash };
  },
};
