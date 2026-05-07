-- DropForeignKey
ALTER TABLE "PersonalityResult" DROP CONSTRAINT "PersonalityResult_subjectId_fkey";

-- AlterTable
ALTER TABLE "PersonalityResult" ALTER COLUMN "subjectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PersonalityResult" ADD CONSTRAINT "PersonalityResult_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
