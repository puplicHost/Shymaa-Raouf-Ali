<script setup>
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import AboutSection from './components/AboutSection.vue'
import SkillsSection from './components/SkillsSection.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import IndustriesSection from './components/IndustriesSection.vue'
import ApproachSection from './components/ApproachSection.vue'
import CertificationsSection from './components/CertificationsSection.vue'
import ContactSection from './components/ContactSection.vue'
import FooterSection from './components/FooterSection.vue'
import AIAssistant from './components/AIAssistant.vue'
</script>

<template>
  <NavBar />
  <main>
    <HeroSection />
    <AboutSection />
    <SkillsSection />
    <ProjectsSection />
    <IndustriesSection />
    <ApproachSection />
    <CertificationsSection />
    <ContactSection />
  </main>
  <FooterSection />
  <AIAssistant />
</template>
